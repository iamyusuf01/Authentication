import userModel from "../models/userModel.js";

export const getUserData = async (req, res) => {
    try {
        // fetching the data from the request body
        const { userId } = req.body;

        // checking if the userId exists in the database
        const user = await userModel.findById(userId);

        // if the user not exists
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found"
             });
        }

        // returning the user data
        return res.status(200).json({
            success: true,
            userData : {
                name: user.name,
                isAccountVerify: user.isAccountVerify
            }
        });
    } catch (error) {
        
    }
}