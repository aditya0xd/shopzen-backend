const z = require("zod")
const { registerUser, loginUser } = require('./auth.service');


const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const register = async (req, res) => {
  
  const valid = schema.safeParse(req.body)
  
  if(!valid.success){
    return res.status(400).json({
      message: "Invalid request data"
    })
  }
  const { email, password } = valid.data;
  try {
    const user = await registerUser(email, password);
    res.status(201).json({ message: 'User registered', userId: user.id });
  } catch (err) {
    console.error(err.message)
    res.status(400).json({ message: 'Invalid email or password' });

  }
};

const login = async (req, res) => {
  
  const valid = schema.safeParse(req.body);
  if(!valid.success){
    return res.status(400).json({
      message: "invalid credentials"
    })
  }
  const { email, password } = valid.data;
  try {

    const token = await loginUser(email, password);

    res.status(200).json(token);

  } catch (err) {
    console.error(err.message)
    res.status(401).json({ message: 'Invalid email or password' });

  }
};

module.exports = { register, login };
