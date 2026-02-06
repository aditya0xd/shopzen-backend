import { registerUser, loginUser } from './auth.service';
import z from "zod"

const schema = z.object({
  username: z.string().min(8),
  password: z.string().min(8),
})

const register = async (req, res) => {
  try {

    const valid = schema.safeParse(req.body)
    
    if(!valid.success){
      return res.status(400).json({
        message: "invalid credentials"
      })
    }
    const { username, password } = valid.data;
    const user = await registerUser(username, password);
    res.status(201).json({ message: 'User registered', userId: user.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {

    const valid = schema.safeParse(req.body);
    if(!valid.success){
      return res.status(400).json({
        message: "invalid credentials"
      })
    }
    const { username, password } = valid.data;

    const token = await loginUser(username, password);

    res.status(200).json(token);

  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

module.exports = { register, login };
