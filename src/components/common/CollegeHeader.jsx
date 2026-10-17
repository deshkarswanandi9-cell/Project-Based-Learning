import React from 'react';
import { Link } from 'react-router-dom';
import jspmLogo from '../../assets/jspm_logo.jpeg';
import rscoeLogo from '../../assets/rscoe_logo.png';

export default function CollegeHeader() {
  return (
    <header className="bg-white text-gray-900 border-b-2 border-brand-maroon/90 shadow-xs w-full select-none z-30">
      <div className="w-full max-w-[96%] xl:max-w-[94%] 2xl:max-w-[92%] mx-auto px-3 sm:px-6 py-2.5 sm:py-3 md:py-3.5 flex items-center justify-between gap-2 sm:gap-4 md:gap-6">
        {/* Left: Official JSPM Logo */}
        <Link
          to="/"
          className="shrink-0 flex items-center justify-center hover:opacity-90 transition-opacity"
          title="JSPM - Rajarshi Shahu College of Engineering"
        >
          <img
            src={jspmLogo}
            alt="JSPM Emblem"
            className="h-14 w-auto sm:h-18 md:h-20 lg:h-22 max-w-[65px] sm:max-w-[85px] md:max-w-[100px] lg:max-w-[110px] object-contain"
          />
        </Link>

        {/* Center: Official Letterhead Institution Text Block */}
        <Link
          to="/"
          className="flex-1 flex flex-col items-center justify-center text-center px-1 sm:px-2 md:px-4 hover:opacity-95 transition-opacity"
          title="JSPM’s Rajarshi Shahu College of Engineering, Tathawade Pune-33 - Department of Computer Engineering"
        >
          {/* Line 1: JSPM’s (small, bold) */}
          <div className="text-xs sm:text-sm font-bold text-gray-900 tracking-normal leading-tight">
            JSPM’s
          </div>

          {/* Line 2: Full college name (prominent and larger) */}
          <h1 className="text-xs sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 tracking-tight leading-tight mt-0.5 sm:mt-1">
            Rajarshi Shahu College of Engineering, Tathawade Pune-33
          </h1>

          {/* Line 3 & 4: Affiliation text (readable font, formatted across two lines) */}
          <div className="text-[10px] sm:text-xs md:text-[13px] text-gray-700 leading-tight sm:leading-snug mt-0.5 sm:mt-1 font-normal sm:font-medium">
            <div>(An Empowered Autonomous Institute Affiliated to Savitribai Phule Pune University</div>
            <div>, Pune)</div>
          </div>

          {/* Line 5: Department name (bold and prominent) */}
          <div className="text-xs sm:text-sm md:text-base font-bold text-gray-900 tracking-normal mt-1 sm:mt-1.5">
            Department of Computer Engineering
          </div>
        </Link>

        {/* Right: Official RSCOE Logo */}
        <Link
          to="/"
          className="shrink-0 flex items-center justify-center hover:opacity-90 transition-opacity"
          title="RSCOE Logo"
        >
          <img
            src={rscoeLogo}
            alt="RSCOE Logo"
            className="h-14 w-auto sm:h-18 md:h-20 lg:h-22 max-w-[65px] sm:max-w-[85px] md:max-w-[100px] lg:max-w-[110px] object-contain"
          />
        </Link>
      </div>
    </header>
  );
}

