import jwt from 'jsonwebtoken';

const userAuth = async (req, res, next) => {
   // fetching the token from request body
   const { token } = req.cookies;   
    //validation 
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access, please try again'
        });
    }

    try {

      const tokenDecode =   jwt.verify(token, process.env.JWT_SECRET);

      if(tokenDecode.id){
        req.body.userId = tokenDecode.id;
      } else {
        return res.status(403).json({
            success: false,
            message: 'Invalid token, please try again'
        });
      }
      
      next();
    } catch (error) {
        console.log(error);
        return res.status(403).json({
            success: false,
            message: 'Invalid token, please try again'
        });
    };
};

export default userAuth;

