import express from 'express';
import cors from 'cors';

import dotenv from 'dotenv'
import cookieParser from 'cookie-parser';

import connectDB from './config/database.js';
import authRouter from './routes/authRouter.js';
import userRouter from './routes/userRoutes.js';



dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000
connectDB();

const allowedOrigins = ["https://authentication-2-3l3z.onrender.com"]

app.use(express.json());
app.use(cookieParser());
app.use(cors({origin: allowedOrigins, credentials: true}));

//Api ends Points
app.get('/', (req, res) => {
    res.send('Hello World programmer');
});

app.use('/api/auth', authRouter)
app.use('/api/user', userRouter)
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})