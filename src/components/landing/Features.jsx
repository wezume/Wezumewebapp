import { motion } from "framer-motion";
import { Briefcase, Users, Rocket, Handshake } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: <Users className="w-8 h-8 text-white" />,
      title: "Verified Recruiters",
      description:
        "Trusted recruiters from top companies are ready to connect with talent.",
    },
    {
      icon: <Handshake className="w-8 h-8 text-white" />,
      title: "Investors",
      description:
        "Investors easily find and connect with businesses for funding opportunities.",
    },
    {
      icon: <Briefcase className="w-8 h-8 text-white" />,
      title: "Jobseekers",
      description:
        "Pitch your 60 sec videos and discover the right opportunities.",
    },
    {
      icon: <Rocket className="w-8 h-8 text-white" />,
      title: "Freelancers / Entrepreneurs",
      description:
        "Showcase your skills and pitch ideas to attract potential clients or investors.",
    },
  ];

  return (
    <section className="relative bg-transparent z-0">
      {/* Wrapper that overlaps Hero */}
      <div className="container mx-auto px-6 lg:px-12 -mt-28 relative">
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.8, ease: "easeOut" }}
              viewport={{ once: false }}
              whileHover={{
                y: -8,
                transition: { duration: 0.25, ease: "easeOut" },
              }}
              className="text-center p-6 bg-gradient-to-br from-blue-500/20 to-blue-700/10 backdrop-blur-md border border-blue-400/20 rounded-xl shadow-lg relative z-30 group"
            >
              {/* Icon */}
              <motion.div
                className="flex justify-center mb-4"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-3 bg-blue-600 rounded-lg shadow-md group-hover:shadow-lg transition-shadow duration-300">
                  {feature.icon}
                </div>
              </motion.div>

              <h3 className="text-xl font-bold text-gray-900 drop-shadow-sm">
                {feature.title}
              </h3>
              <p className="mt-2 text-gray-700 drop-shadow-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
