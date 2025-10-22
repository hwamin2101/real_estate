import Link from "next/link";
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebook,
  faInstagram,
  faTwitter,
  faLinkedin,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";

const FooterSection = () => {
  return (
    <footer className="border-t border-gray-200 py-20">
      <div className="max-w-4xl mx-auto px-6 sm:px-9">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4">
            <Link href="/" className="text-xl font-bold" scroll={false}>
              RENTIFUL
            </Link>
          </div>
          <nav className="mb-7">
            <ul className="flex space-x-3">
              <li>
              <Link href="/about">Về Chúng Tôi</Link>
                </li>
                <li>
                  <Link href="/contact">Liên Hệ</Link>
                </li>
                <li>
                  <Link href="/faq">Câu Hỏi Thường Gặp</Link>
                </li>
                <li>
                  <Link href="/terms">Điều Khoản Sử Dụng</Link>
                </li>
                <li>j
                  <Link href="/privacy">Chính Sách Bảo Mật</Link>
                </li>
            </ul>
          </nav>
          <div className="flex space-x-4 mb-4">
            <a
              href="#"
              aria-label="Facebook"
              className="hover:text-primary-600"
            >
              <FontAwesomeIcon icon={faFacebook} className="h-6 w-6" />
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="hover:text-primary-600"
            >
              <FontAwesomeIcon icon={faInstagram} className="h-6 w-6" />
            </a>
            <a href="#" aria-label="Twitter" className="hover:text-primary-600">
              <FontAwesomeIcon icon={faTwitter} className="h-6 w-6" />
            </a>
            <a
              href="#"
              aria-label="Linkedin"
              className="hover:text-primary-600"
            >
              <FontAwesomeIcon icon={faLinkedin} className="h-6 w-6" />
            </a>
            <a href="#" aria-label="Youtube" className="hover:text-primary-600">
              <FontAwesomeIcon icon={faYoutube} className="h-6 w-6" />
            </a>
          </div>
        </div>
        <div className="mt-7 text-center text-sm text-gray-500 flex justify-center space-x-5">
          <span>© RENTiful. Đã đăng ký bản quyền.</span>
          <Link href="/privacy">Chính Sách Bảo Mật</Link>
          <Link href="/terms">Điều Khoản Dịch Vụ</Link>
          <Link href="/cookies">Chính Sách Cookie</Link>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
