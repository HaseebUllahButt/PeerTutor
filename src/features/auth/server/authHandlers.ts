import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';
import { z, ZodError } from 'zod';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Session from '@/models/Session';
import { signToken, verifyToken } from '@/lib/auth';
import { resolveAuthToken } from '@/lib/resolveAuthToken';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['student', 'tutor', 'admin']).default('student'),
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export async function registerUser(request: Request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return NextResponse.json({ message: 'An account with this email already exists.' }, { status: 400 });
    }

    const newUser = await User.create(validatedData);

    return NextResponse.json(
      {
        message: 'Registration successful! Welcome to PeerTutor.',
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof ZodError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const zodErr = err as any;
      return NextResponse.json(
        { message: zodErr.issues?.[0]?.message || zodErr.errors?.[0]?.message || 'Invalid input', errors: zodErr.issues ?? zodErr.errors },
        { status: 400 }
      );
    }
    console.error('Registration Error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function loginUser(request: Request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    const token = signToken({
      userId: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
    });

    const response = NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (err) {
    if (err instanceof ZodError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const zodErr = err as any;
      return NextResponse.json(
        { message: zodErr.issues?.[0]?.message || zodErr.errors?.[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    console.error('Login Error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function logoutUser() {
  const response = NextResponse.json({ message: 'Logged out successfully' });
  response.cookies.set('token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  return response;
}

export async function getCurrentUser(request: Request) {
  try {
    const token = await resolveAuthToken(request);

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(payload.userId).select('name email role profilePicture tutorProfile');

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const tutorProfile = user.tutorProfile ?? payload.tutorProfile;

    return NextResponse.json({
      userId: payload.userId,
      role: user.role,
      name: user.name,
      email: user.email,
      tutorProfile,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        tutorProfile,
      },
    });
  } catch (error) {
    console.error('Auth ME Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function deleteAccount() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    await connectToDatabase();

    await Session.deleteMany({
      $or: [{ student: payload.userId }, { tutor: payload.userId }],
    });

    const result = await User.findByIdAndDelete(payload.userId);

    if (!result) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const response = NextResponse.json({ message: 'Account deleted successfully' });
    response.cookies.set('token', '', { maxAge: 0, path: '/' });

    return response;
  } catch (error) {
    console.error('Account Deletion Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function updateCurrentUser(request: Request) {
  try {
    const token = await resolveAuthToken(request);
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });

    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : null;
    if (!name || name.length < 2) {
      return NextResponse.json({ message: 'Name must be at least 2 characters' }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findByIdAndUpdate(
      payload.userId,
      { name },
      { new: true, select: 'name email role' }
    );
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    // Re-issue JWT so the sidebar/topbar reflects the new name immediately
    const newToken = signToken({
      userId: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
    });
    const response = NextResponse.json({ message: 'Profile updated', user: { name: user.name, email: user.email, role: user.role } });
    response.cookies.set('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Update Profile Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function getTabSessionToken() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({ token });
  } catch (error) {
    console.error('tab-session Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
