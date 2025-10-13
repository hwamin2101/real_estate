"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const DiscoverSection = () => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.8 }}
      variants={containerVariants}
      className="py-12 bg-white mb-16"
    >
      <div className="max-w-6xl xl:max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
        <motion.div variants={itemVariants} className="my-12 text-center">
          <h2 className="text-3xl font-semibold leading-tight text-gray-800">
            Khám phá ngay
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Tìm căn hộ cho thuê mơ ước của bạn ngay hôm nay!
          </p>
          <p className="mt-2 text-gray-500 max-w-3xl mx-auto">
            Việc tìm kiếm căn hộ cho thuê mơ ước của bạn chưa bao giờ dễ dàng đến thế.
            Với tính năng tìm kiếm thân thiện và tiện lợi, bạn có thể nhanh chóng tìm được ngôi nhà hoàn hảo đáp ứng mọi nhu cầu của mình.
            Hãy bắt đầu tìm kiếm ngay hôm nay và khám phá căn hộ mơ ước của bạn!
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 xl:gap-16 text-center">
          {[
            {
              imageSrc: "/landing-icon-wand.png",
              title: "Tìm kiếm căn hộ",
              description:
                "Khám phá kho căn hộ cho thuê đa dạng tại khu vực mà bạn mong muốn.",
            },
            {
              imageSrc: "/landing-icon-calendar.png",
              title: "Đặt thuê căn hộ",
              description:
                "Khi đã tìm được căn hộ ưng ý, bạn có thể dễ dàng đặt thuê trực tuyến chỉ với vài thao tác.",
            },
            {
              imageSrc: "/landing-icon-heart.png",
              title: "Tận hưởng tổ ấm mới",
              description:
                "Chuyển vào căn hộ mới và bắt đầu tận hưởng không gian sống mơ ước của bạn.",
            },
          ].map((card, index) => (
            <motion.div key={index} variants={itemVariants}>
              <DiscoverCard {...card} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const DiscoverCard = ({
  imageSrc,
  title,
  description,
}: {
  imageSrc: string;
  title: string;
  description: string;
}) => (
  <div className="px-4 py-12 shadow-lg rounded-lg bg-primary-50 md:h-72">
    <div className="bg-primary-700 p-[0.6rem] rounded-full mb-4 h-10 w-10 mx-auto">
      <Image
        src={imageSrc}
        width={30}
        height={30}
        className="w-full h-full"
        alt={title}
      />
    </div>
    <h3 className="mt-4 text-xl font-medium text-gray-800">{title}</h3>
    <p className="mt-2 text-base text-gray-500">{description}</p>
  </div>
);

export default DiscoverSection;
