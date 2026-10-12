import React from 'react';
import { Link } from 'react-router-dom';
import jspmLogo from '../../assets/jspm_logo.jpeg';
import rscoeLogo from '../../assets/rscoe_logo.png';

export default function CollegeHeader() {
  return (
    <header className="bg-brand-maroon text-white border-b border-black/10 w-full select-none shadow-2xs z-30">
      <div className="w-full max-w-[96%] xl:max-w-[94%] 2xl:max-w-[92%] mx-auto px-4 sm:px-6 h-[80px] sm:h-[88px] md:h-[92px] flex items-center justify-between gap-3 sm:gap-6">
        {/* Left: College Emblem / JSPM Logo */}
        <Link
          to="/"
          className="flex-shrink-0 flex items-center hover:opacity-90 transition"
          title="JSPM - Rajarshi Shahu College of Engineering"
        >
          <div className="bg-white rounded-md p-1 sm:p-1.5 shadow-2xs flex items-center justify-center border border-white/20">
            <img
              src={jspmLogo}
              alt="JSPM Emblem"
              className="h-10 w-10 sm:h-12 sm:w-12 md:h-13 md:w-13 object-contain"
            />
          </div>
        </Link>

        {/* Center: College Name */}
        <Link
          to="/"
          className="flex-1 flex flex-col items-center justify-center text-center px-2 hover:opacity-95 transition"
          title="JSPM'S RAJARSHI SHAHU COLLEGE OF ENGINEERING"
        >
          <h1 className="font-semibold md:font-bold uppercase tracking-wider text-white text-center text-xs sm:text-sm md:text-base lg:text-lg leading-snug">
            <span className="block">JSPM'S RAJARSHI SHAHU</span>
            <span className="block text-[11px] sm:text-xs md:text-sm lg:text-base font-medium md:font-semibold text-white/95 tracking-widest mt-0.5">
              COLLEGE OF ENGINEERING
            </span>
          </h1>
        </Link>

        {/* Right: RSCOE Logo */}
        <Link
          to="/"
          className="flex-shrink-0 flex items-center hover:opacity-90 transition"
          title="RSCOE Logo"
        >
          <div className="bg-white rounded-md p-1 sm:p-1.5 shadow-2xs flex items-center justify-center border border-white/20">
            <img
              src={rscoeLogo}
              alt="RSCOE Logo"
              className="h-10 w-10 sm:h-12 sm:w-12 md:h-13 md:w-13 object-contain"
            />
          </div>
        </Link>
      </div>
    </header>
  );
}
