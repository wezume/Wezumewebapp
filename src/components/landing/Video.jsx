import { motion } from "framer-motion";

export default function Video() {
  return (
    <section className="bg-gradient-to-b from-white via-blue-50 to-white py-8">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <p className="text-gray-700 leading-relaxed text-xl font-semibold">
            Don&apos;t just apply –{" "}
            <span className="text-blue-600">impress.</span>{" "}
            Don&apos;t just type – <span className="text-blue-600">talk.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
