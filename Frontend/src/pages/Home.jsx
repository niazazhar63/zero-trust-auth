import React from "react";
import { assets } from "../assets/asstes";

const Home = () => {
  return (
    <div className="mx-8 min-h-[70vh] flex justify-center items-center sm:mx-16 xl:mx-24 relative">
      <div>
        <div className="text-center sm:mt-20 mb-8">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-700 sm:leading-16">
            The <span className="text-primary">Zero Trust Auth</span> <br />{" "}
            Thesis Project by <span className="text-primary">Azhar Niaz Kakon</span>
          </h1>

          <p className="my-6 sm:my-8 max-w-2xl m-auto max-sm:text-xs text-gray-500">
            Explore the future of secure authentication with our Zero Trust Auth system. 
            This project demonstrates a modern approach to digital security, 
            ensuring that every user, device, and access request is continuously verified. 
            Dive in to see how risk-based access, multi-level authentication, 
            and intelligent security checks come together in a real-world application.
          </p>

           <p className="my-6 sm:my-8 max-w-2xl m-auto max-sm:text-xs text-gray-500">
            This thesis project demonstrates a dynamic Zero Trust Authentication system. 
            It continuously evaluates every login attempt based on risk factors like device, location, and behavior. 
            For low-risk users, access is seamless; for medium-risk attempts, an OTP verification is triggered; 
            and high-risk attempts are temporarily blocked to prevent unauthorized access. 
            The system reacts in real-time, ensuring security while adapting to each user’s behavior.
          </p>
        </div>
        <img
          src={assets.gradientBackground}
          className="absolute -top-50 -z-1 opacity-50"
          alt=""
        />
      </div>
    </div>
  );
};

export default Home;
