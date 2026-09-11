import Navbar from "./Navbar";
import HeroBackground from "./HeroBackground";
import { motion } from "framer-motion";

const Hero = () => {
  return (
    <div
      id="home"
      className="relative min-h-screen overflow-hidden bg-blue-600"
    >
      {/* Background */}
      <HeroBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navbar */}
        <Navbar />

        {/* Main Hero Section: Row Layout at lg+, Column Layout on mobile */}
        <div className="flex flex-1 flex-col lg:flex-row items-center justify-center px-6 lg:px-20 py-30 gap-12 lg:gap-20">
          <motion.div
            initial={{ x: -200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="
    hidden lg:flex flex-shrink-0 
    w-[200px] h-[360px] xl:w-[260px] xl:h-[460px]
    items-center justify-center
    cursor-pointer
  "
          >
            <div
              className="
      relative w-[180px] h-[325px] xl:w-[245px] xl:h-[435px]
      bg-gray-900 rounded-[40px] shadow-2xl
      border-[10px] border-black flex flex-col
    "
            >
              {/* Phone Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 xl:w-24 xl:h-5 bg-gray-800 rounded-b-lg"></div>
              {/* Phone Screen */}
              <div className="flex-grow mt-4 xl:mt-5 mb-2 xl:mb-3 mx-1.5 xl:mx-2 bg-blue-500 rounded-[28px] overflow-hidden flex flex-col">
                {/* Screenshot Image */}
                <img
                  src="landing.jpeg"
                  alt="App Screenshot"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>
          </motion.div>

          {/* Hero Content Section */}
          <motion.div
            initial={{ x: 200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="
              w-full lg:w-1/2
              flex flex-col items-center lg:items-start
              text-center lg:text-left
              text-white
            "
          >
            {/* Heading */}
            <div className="flex flex-col sm:flex-row gap-1">
              <h1 className="text-4xl sm:text-5xl lg:text-5xl font-extrabold mb-4 leading-tight">
                Speak <span className="text-blue-600">Up.</span>
              </h1>

              <h1 className="text-4xl sm:text-5xl lg:text-5xl font-extrabold mb-4 leading-tight">
                Stand <span className="text-blue-600">Out.</span>
              </h1>
            </div>

            {/* Subheading */}
            <p className="mt-6 text-lg sm:text-xl lg:text-2xl text-white/90 font-medium leading-relaxed">
              Record a 1-min video resume, get{" "}
              <span className="text-white font-bold">AI feedback</span>, and
              get discovered by recruiters — who see AI-matched
              culture-fit scores.
            </p>

            {/* CTA */}
            <p className="mt-6 text-base sm:text-lg text-white/80">
              Download the Wezume app today and shine.
            </p>

            {/* Download Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <a href="https://play.google.com/store/apps/details?id=com.vprofile">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                  alt="Get it on Google Play"
                  className="h-14 w-auto object-contain"
                />
              </a>
              <a href="https://apps.apple.com/in/app/wezume/id6740565222">
                <img
                  src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                  alt="Download on the App Store"
                  className="h-14 w-auto object-contain"
                />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
