import React from "react";

export default function OnboardingScreen({ setIsDashboard }) {
  return (
    <div className="min-h-screen bg-white flex items-end justify-center">
      <div className="w-[390px] h-[844px] relative shadow-md overflow-hidden">
        {/* Top blue area */}
        <div className="absolute left-0 top-0 w-full h-[60%] bg-[#3F63F0]">
          {/* decorative zig-zags top-left */}
          <svg
            className="absolute left-6 top-6 opacity-20"
            width="86"
            height="48"
            viewBox="0 0 86 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 36L12 12L24 36L36 12L48 36L60 12L72 36"
              stroke="#FFFFFF"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* big faint zig-zag near lower-right */}
          <svg
            className="absolute right-12 bottom-20 opacity-15 transform translate-y-6"
            width="200"
            height="120"
            viewBox="0 0 200 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 90L36 30L72 90L108 30L144 90L180 30"
              stroke="#FFFFFF"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Bottom white card area */}
        <div className="absolute left-0 bottom-0 w-full h-[40%] bg-white px-6 pt-8">
          <h1 className="text-2xl font-extrabold text-gray-900">
            Manage What To Do
          </h1>
          <p className="mt-3 text-sm text-gray-400 max-w-[320px]">
            The best way to manage what you have to do, don’t forget your plans
          </p>

          {/* Spacer to push the button near bottom */}
          <div className="flex-1" style={{ height: 46 }} />

          <div className="mb-6">
            <button
              onClick={() => setIsDashboard(true)}
              className="w-full py-4 rounded-md text-white font-medium bg-[#4B66F7] shadow-sm"
            >
              Get Started
            </button>
          </div>
        </div>

        {/* subtle divider line between blue and white (sharp) */}
        <div className="absolute left-0 w-full top-[60%] h-px bg-white" />
      </div>
    </div>
  );
}
