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
            className="h-16 w-auto sm:h-20 md:h-24 lg:h-26 max-w-[80px] sm:max-w-[100px] md:max-w-[125px] lg:max-w-[135px] object-contain shrink-0"
          />
        </Link>

        {/* Center: Official Letterhead Institution Text Block */}
        <Link
          to="/"
          className="flex-1 flex flex-col items-center justify-center text-center px-1 sm:px-2 md:px-4 hover:opacity-95 transition-opacity"
          title="JSPM’s Rajarshi Shahu College of Engineering, Tathawade Pune-33 - Department of Computer Engineering"
        >
          {/* Line 1: JSPM's (small, bold) */}
          <div className="text-xs sm:text-sm font-bold text-gray-900 tracking-normal leading-tight">
            JSPM's
          </div>

          {/* Line 2: Full college name (prominent and larger) */}
          <h1 className="text-xs sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 tracking-tight leading-tight mt-0.5 sm:mt-1">
            Rajarshi Shahu College of Engineering, Tathawade Pune-33
          </h1>

          {/* Line 3: Affiliation text (ends with 'Pune)' on the same line on desktop screens) */}
          <div className="text-[10px] sm:text-[11.5px] md:text-xs lg:text-[13px] text-gray-700 leading-tight sm:leading-snug mt-0.5 sm:mt-1 font-normal sm:font-medium max-w-2xl mx-auto sm:whitespace-nowrap">
            (An Empowered Autonomous Institute Affiliated to Savitribai Phule Pune University, Pune)
          </div>

          {/* Line 4: Department name (bold and prominent) */}
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
            className="h-16 w-auto sm:h-20 md:h-24 lg:h-26 max-w-[80px] sm:max-w-[100px] md:max-w-[125px] lg:max-w-[135px] object-contain shrink-0"
          />
        </Link>
      </div>
    </header>
  );
}

