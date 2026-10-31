
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { User } from "../models/User.model.js";
import { Profile } from "../models/Profile.model.js";
import { env } from "../config/env.js";
import type { AuthRequest } from
  "../middlewares/auth.middleware.js";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email(),
  password: z.string().min(8).max(128)
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string()
});

function issueSession(
  res: Response,
  userId: string
) {
  const token = jwt.sign(
    {},
    env.JWT_SECRET,
    {
      subject: userId,
      algorithm: "HS256",
      expiresIn: "2h"
    }
  );

  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 2 * 60 * 60 * 1000,
    path: "/"
  });
}

function publicUser(user: any) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    language: user.language
  };
}

export async function register(
  req: Request,
  res: Response
) {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      errors: z.flattenError(parsed.error)
    });
    return;
  }

  const { name, password } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const existing = await User.exists({ email });

  if (existing) {
    res.status(409).json({
      success: false,
      message: "Email already registered"
    });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: "tourist"
    });

    await Profile.create({
      userId: user._id
    });

    issueSession(res, String(user._id));

    res.status(201).json({
      success: true,
      user: publicUser(user)
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      res.status(409).json({
        success: false,
        message: "Email already registered"
      });
      return;
    }

    throw error;
  }
}

export async function login(
  req: Request,
  res: Response
) {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Invalid login data"
    });
    return;
  }

  const user = await User.findOne({
    email: parsed.data.email.toLowerCase(),
    isActive: true
  }).select("+passwordHash");

  const valid = user
    ? await bcrypt.compare(
        parsed.data.password,
        user.passwordHash
      )
    : false;

  if (!user || !valid) {
    res.status(401).json({
      success: false,
      message: "Invalid email or password"
    });
    return;
  }

  issueSession(res, String(user._id));

  res.json({
    success: true,
    user: publicUser(user)
  });
}

export async function me(
  req: AuthRequest,
  res: Response
) {
  const user = await User.findById(req.userId);

  if (!user || !user.isActive) {
    res.status(401).json({
      success: false,
      message: "User not found or inactive"
    });
    return;
  }

  res.json({
    success: true,
    user: publicUser(user)
  });
}

export function logout(
  _req: Request,
  res: Response
) {
  res.clearCookie("accessToken", {
    path: "/"
  });

  res.json({
    success: true,
    message: "Logged out"
  });
}
