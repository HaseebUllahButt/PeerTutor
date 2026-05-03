import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/auth';
import { z, ZodError } from 'zod';
import bcrypt from 'bcrypt';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: Request) {
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
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (err) {
    if (err instanceof ZodError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const zodErr = err as any;
      return NextResponse.json(
        { message: zodErr.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    console.error('Login Error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
