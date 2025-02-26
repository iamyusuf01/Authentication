import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import transporter from '../config/nodeMailer.js'
import dotenv from 'dotenv';

// UserRegister
 export const userRegister = async (req, res) => {
    try {
        //fetch data from request body
        const { name, email, password } = req.body;
        
        
        //validation 
        if(!name || !email || !password){
            return res.json({ 
                success: false,
                message: 'All fields are required' });
        }

        //check if email already exists
        const existingUser = await userModel.findOne({ email });
        //validation
        if(existingUser){
            return res.json({ 
                success: false,
                message: 'Email already exists' });
        }

        //password incryption
        const hashedPassword = await bcrypt.hash(password, 10);
        
        //CREATE NEW USER
         const user = new userModel({ name, email, password: hashedPassword });
         await user.save();

         //Generate token 
         const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

         //Send cookies
         res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds  // 1 week in milliseconds  // 7 days in milliseconds * 24 hours * 60 minutes * 60 seconds
         })

         //Send welcome Email to user
         const mailOptions = {
             from: process.env.SMTP_USER,
             to: email,
             subject: 'Welcome to My Website',
             text: `Welcome to My Website. Your registration was successful. email id: ${email} Enjoy your stay!`
         }

            await transporter.sendMail(mailOptions);

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                  console.error("Error sending email:", error);
                } else {
                  console.log("Email sent successfully:", info.response);
                }
              });
            
         //return response
         return res.json({ 
             success: true,
             message: 'User registered successfully',
             
            });

    } catch (error) {
        console.log(error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};


// Login
export const login = async (req, res) => {
    try {
        //fetch data from request body
        const { email, password } = req.body;

        //validation 
        if(!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required' });
        }
        //user Exists or not exist
        const user = await userModel.findOne({email});
        if(!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found' });
        }
        // cheching user passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Incorrect password' });
        }

        //Generate token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        //Send cookies
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds  // 1 week in milliseconds  // 7 days in milliseconds * 24 hours * 60 minutes * 60 seconds
        })

        //return response
        return res.status(200).json({
            success: true,
            message: 'User logged in successfully',
            user: user
        });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Server Error' });
    }
};

//LogOut 
export const logOut = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })

        return res.status(200).json({
            success: true,
            message: 'User logged out successfully'
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Server Error'
        })
    }
};

//Send verification otp
export const sendVerifyOtp = async (req, res) => {
    try {
        //fetching details from request body
        const { userId } = req.body;

        const user = await userModel.findById(userId)
        //validating details
        if(user.isAccountVerify) {
            return res.status(400).json({
                success: false,
                message: 'User already verified'
            });
        }

        //Generating OTP
        const otp = String(Math.floor(1000 + Math.random() * 9000));

        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

        await user.save();

         //Send email
         const mailOptions = {
            from: process.env.SMTP_USER,
            to: user.email,
            subject: 'Account verification otp',
            text: `Your OTP is ${otp}. Verify your account using OTP.`
        }
        await transporter.sendMail(mailOptions);

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.error("Error sending email:", error);
            } else {
              console.log("Email sent successfully:", info.response);
            }
          });

        return res.status(200).json({
             success: true,
             message: 'OTP sent successfully',
             otp: otp
         })
           
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Server Error'
        })
    }
};

//Verify Email Address

export const verifyEmail = async (req, res) => {
   try {
    const { userId, otp } = req.body;

    if(!userId || !otp) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required'
        });
     }
     
     const user = await userModel.findById(userId);
     
     //check if user exist
     if(user.verifyOtp === '' || user.verifyOtp !== otp){
         return res.status(400).json({
             success: false,
             message: 'Invalid OTP or User not found'
         });
     }

     if(user.verifyOtpExpireAt < Date.now()) {
         return res.status(400).json({
             success: false,
             message: 'OTP expired'
         });
      }

     user.isAccountVerify = true;
     user.verifyOtp = '';
     user.verifyOtpExpireAt = 0;

     await user.save();

     return res.status(200).json({
         success: true,
         message: 'Email verified successfully'
     });

    
   } catch (error) {
     console.log(error);
     return res.status(500).json({
         success: false,
         message: 'Server Error'
     });
   };

};

// check if user is Authenticated
export const isAuthenticated = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: 'User is authenticated'
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

//Send Password Reset Otp
export const sendResetOtp = async (req, res) => {
    try {
        // fetching the data from the request body
        const { email } = req.body;
        //validation 
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await userModel.findOne({ email });

        if(!user){
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        //Generating OTP
        const otp = String(Math.floor(1000 + Math.random() * 9000));

        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

        await user.save();

         //Send email
          const mailOptions = {
            from: process.env.SMTP_USER,
            to: user.email,
            subject: 'Password Reset OTP',
            text: `Your OTP for reseting your password is ${otp}.
            Use this OTP to proceed with reseting your password.`
        }

           await transporter.sendMail(mailOptions);

          return res.status(200).json({
            success: true,
            message: 'OTP sent to your email ',
            otp: otp
          })
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

//reset user password
export const resetPassword = async (req, res) => {
    try {
        //data fetching through the body
        const { email, otp, newPassword } = req.body;

        //validation 
        if(!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const user = await userModel.findOne({ email });

        if(!user){
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

         if(user.resetOtp === "" || user.resetOtp !== otp) {
             return res.status(400).json({
                 success: false,
                 message: 'Invalid OTP or User not found'
             });
         }

         if(user.resetOtpExpireAt < Date.now()) {
             return res.status(400).json({
                 success: false,
                 message: 'OTP expired'
             });
         }

          const  hashedPassword = await bcrypt.hash(newPassword, 10);
          user.password = hashedPassword;
          user.resetOtp = '';
          user.resetOtpExpireAt = 0;

          await user.save();

          return res.status(200).json({
              success: true,
              message: 'Password reset successfully'
          });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};