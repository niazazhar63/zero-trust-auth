import React from "react";
import RequestForm from "../components/RequestForm";

const RequestAccess = () => {
  return <div className="min-h-screen flex items-center justify-center">
        <div className="">
            <h1 className="text-2xl sm:text-6xl font-bold text-center w-4xl ">Wanna Request to create an <span className="text-[#A3DC9A]">Account</span>?</h1>

            <div className="my-7 p-3">
                
                <RequestForm />
            </div>

        </div>
    </div>;
};

export default RequestAccess;
