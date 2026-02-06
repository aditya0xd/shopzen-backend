import { Schema } from 'zod/v3';
import { registerUser, loginUser } from './auth.service';
import z from "zod"

const schema = z.object({
  username: z.string().min(3),
  password: z.string().min(8)
})

const register = async (req, res) => {
  try {

    const valid = schema.safeParse(req.body)
    
    if(!valid.success){
      return res.status(406).json({
        message: "invalid credentials"
      })
    }
    const { email, password } = valid.data;
    const user = await registerUser(email, password);
    res.status(201).json({ message: 'User registered', userId: user.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {

    const valid = schema.safeParse(req.body);
    if(!valid.success){
      return res.status(406).json({
        message: "invalid credentials"
      })
    }
    const { email, password } = valid.data;
    
    // if(email === undefined || password === undefined) {
    //   return res.status(400).json({ error: 'Email and password are required' });
    // }
    // if(email.trim() === '' || password.trim() === '') {
    //   return res.status(400).json({ error: 'Email and password cannot be empty' });
    // }

    const token = await loginUser(email, password);

    res.status(200).json(token);

  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

module.exports = { register, login };
