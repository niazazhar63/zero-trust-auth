import { createContext, useState } from "react";
import app from "../firebase/firebase.config";
import { getAuth } from "firebase/auth";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);
const auth = getAuth(app)

const AuthProvider = ({children})=> {
    const [user, setUser] = useState(null);
    const authInfo = {
        user,
        setUser,
        auth
    }

    return (
        <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>
    )
}

export default AuthProvider;
