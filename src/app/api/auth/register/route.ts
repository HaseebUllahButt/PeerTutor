import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { z, ZodError } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['student', 'tutor', 'admin']).default('student'),
});

export async function POST(request: Request) {
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
        { message: zodErr.errors[0]?.message || 'Invalid input', errors: zodErr.errors },
        { status: 400 }
      );
    }
    console.error('Registration Error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
