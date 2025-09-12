import { createContext, useEffect, useState } from "react";
import app from "../firebase/firebase.config";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);
const auth = getAuth(app)

const AuthProvider = ({children})=> {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);





    // login user 
    const loginUser = (email, password)=>{
        setLoading(true);
        return signInWithEmailAndPassword(auth, email, password)
    }

    // log out user 
    const logOut = ()=> {
        setLoading(true)
        return signOut(auth)
    }


    // checks user logged in or not 
    useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      console.log("Current User -->", currentUser);
      setLoading(false);
    });

    return () => {
      return unsubscribe();
    };
  }, []);



    const authInfo = {
        user,
        setUser,
        auth,
        loginUser,
        loading,
        logOut,

    }

    return (
        <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>
    )
}

export default AuthProvider;
