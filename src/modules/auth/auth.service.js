import prisma from '../../utils/prisma'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const registerUser = async (username, password) => {
  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, password: hashedPassword }
  });

  return user;
};

const loginUser = async (username, password) => {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new Error('Invalid credentials');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Invalid credentials');

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { token };
};

module.exports = { registerUser, loginUser };
