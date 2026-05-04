"use client";
import "./homePage.css";
import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";

import campusBackground from "../pictures/HocVienCoSoHomePage.png";
import logoPtitTrang from "../pictures/PtitLogo.svg";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

// Mảng dữ liệu điều hướng cho header và footer, dùng để render menu bằng map.
const navigationItems = [
  { label: "Trang chủ", href: "#trangChu" },
  { label: "Giới thiệu", href: "#gioiThieu" },
  { label: "Tính năng", href: "#tinhNang" },
  { label: "Vai trò", href: "#vaiTro" },
  { label: "Liên hệ", href: "#lienHe" },
];

// Mảng dữ liệu điểm nhấn giúp giới thiệu nhanh phạm vi nghiệp vụ của hệ thống.
const introHighlights = [
  {
    title: "05 vai trò phối hợp",
    description:
      "Kết nối quản trị viên, cán bộ đào tạo, giảng viên, kỹ thuật viên và sinh viên trong cùng một luồng làm việc.",
  },
  {
    title: "08 nhóm tính năng cốt lõi",
    description:
      "Bao quát từ xếp lịch, kiểm tra ràng buộc đến công bố lịch và xử lý thay đổi phát sinh.",
  },
  {
    title: "01 quy trình xuyên suốt",
    description:
      "Tập trung dữ liệu lịch thực hành phòng máy để giảm nhập liệu thủ công và hạn chế sai sót.",
  },
];

// Mảng dữ liệu 5 vai trò nghiệp vụ chính của hệ thống, dùng để render card vai trò bằng map.
const roleCards = [
  {
    title: "Quản trị viên",
    description:
      "Quản lý tài khoản, phân quyền, dữ liệu nền và theo dõi toàn hệ thống.",
    iconName: "shield",
  },
  {
    title: "Cán bộ đào tạo",
    description:
      "Tạo yêu cầu xếp lịch, kiểm tra điều kiện phòng, duyệt và công bố lịch thực hành.",
    iconName: "clipboard",
  },
  {
    title: "Giảng viên",
    description:
      "Tra cứu lịch dạy, xem thông tin phòng và đề xuất đổi, bù hoặc hủy lịch khi cần.",
    iconName: "teacher",
  },
  {
    title: "Kỹ thuật viên",
    description:
      "Theo dõi tình trạng phòng máy, thiết bị và ghi nhận sự cố kỹ thuật.",
    iconName: "monitor",
  },
  {
    title: "Sinh viên",
    description:
      "Tra cứu lịch thực hành đã công bố, nhận thông báo và gửi phản ánh sai sót.",
    iconName: "student",
  },
];

// Mảng dữ liệu các tính năng nổi bật, dùng để render khu vực tính năng bằng map.
const featureCards = [
  {
    title: "Quản lý lịch thực hành",
    description:
      "Tập trung kế hoạch theo tuần, theo học phần và theo từng phòng máy để dễ theo dõi.",
    iconName: "calendar",
    isFeatured: true,
  },
  {
    title: "Kiểm tra trùng phòng, trùng giảng viên",
    description: "Phát hiện xung đột để giảm lỗi khi xếp lịch và đổi lịch.",
    iconName: "warning",
  },
  {
    title: "Kiểm tra số máy và phần mềm yêu cầu",
    description:
      "Đối chiếu sức chứa, cấu hình và phần mềm với nhu cầu từng lớp thực hành.",
    iconName: "laptop",
  },
  {
    title: "Quản lý phòng máy, thiết bị, phần mềm",
    description:
      "Theo dõi trạng thái tài nguyên để bảo đảm phòng sẵn sàng trước khi công bố lịch.",
    iconName: "settings",
  },
  {
    title: "Duyệt và công bố lịch",
    description:
      "Chuẩn hóa bước kiểm tra trước khi ban hành lịch thực hành chính thức.",
    iconName: "approve",
  },
  {
    title: "Thông báo thay đổi lịch",
    description:
      "Cập nhật nhanh khi có điều chỉnh phòng, ca học hoặc giảng viên phụ trách.",
    iconName: "bell",
  },
  {
    title: "Báo cáo sự cố phòng máy",
    description:
      "Ghi nhận lỗi thiết bị, phần mềm và tình trạng phòng để xử lý kịp thời.",
    iconName: "alert",
  },
  {
    title: "Tra cứu lịch theo vai trò",
    description:
      "Mỗi nhóm người dùng nhìn thấy thông tin đúng nhu cầu, rõ ràng và dễ thao tác.",
    iconName: "search",
  },
];

// Mảng dữ liệu liên kết footer, dùng để render nhóm liên kết giả phục vụ landing page.
const footerLinks = [
  { label: "Giới thiệu", href: "#gioiThieu" },
  { label: "Tính năng", href: "#tinhNang" },
  { label: "Hỗ trợ", href: "#quyTrinh" },
  { label: "Liên hệ", href: "#lienHe" },
];

/**
 * Hàm nhận vào: iconName là tên icon cần hiển thị.
 * Hàm xử lý: chọn biểu tượng SVG phù hợp cho từng khu vực của landing page.
 * Hàm trả về: JSX chứa icon tương ứng, nếu không khớp sẽ trả về icon mặc định.
 */
const renderLineIcon = (iconName) => {
  switch (iconName) {
    case "menu":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3l7 3v5c0 4.5-2.8 8.4-7 10-4.2-1.6-7-5.5-7-10V6l7-3z" />
        </svg>
      );
    case "clipboard":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 4h6l1 2h3v14H5V6h3l1-2zM9 10h6M9 14h6" />
        </svg>
      );
    case "teacher":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6h16v8H4zM8 18h8M12 14v4M8 10h8" />
        </svg>
      );
    case "monitor":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 5h16v10H4zM9 19h6M12 15v4" />
        </svg>
      );
    case "student":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 9l9-4 9 4-9 4-9-4zM7 11v4c0 1.8 2.2 3 5 3s5-1.2 5-3v-4" />
        </svg>
      );
    case "calendar":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 3v3M17 3v3M4 8h16M5 5h14v15H5zM8 12h3M13 12h3M8 16h3" />
        </svg>
      );
    case "warning":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4l8 14H4L12 4zM12 10v4M12 17h.01" />
        </svg>
      );
    case "laptop":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 6h14v9H5zM3 18h18" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 8.5A3.5 3.5 0 1 1 8.5 12 3.5 3.5 0 0 1 12 8.5zM19 12l2-1-1-3-2 .2-.9-1.6 1.2-1.7-2.2-2.2-1.7 1.2L13 3l-1-2h-3l-1 2-1.6.9-1.7-1.2L2.5 5l1.2 1.7L2.8 8.3 1 8l-1 3 2 1v2l-2 1 1 3 1.8-.3 1 1.6-1.2 1.7L5 23.5l1.7-1.2 1.6.9 1 1.8h3l1-1.8 1.6-.9 1.7 1.2 2.2-2.2-1.2-1.7.9-1.6 2 .3 1-3-2-1z" />
        </svg>
      );
    case "approve":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9zM8 12l2.5 2.5L16 9" />
        </svg>
      );
    case "bell":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 16h12l-1.5-2v-3a4.5 4.5 0 0 0-9 0v3L6 16zM10 18a2 2 0 0 0 4 0" />
        </svg>
      );
    case "alert":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3l9 16H3L12 3zM12 9v4M12 16h.01" />
        </svg>
      );
    case "search":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4" />
        </svg>
      );
    case "spark":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
        </svg>
      );
    case "layers":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4l8 4-8 4-8-4 8-4zM4 12l8 4 8-4M4 16l8 4 8-4" />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9zM12 7v5l3 2" />
        </svg>
      );
    case "arrowRight":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
  }
};

/**
 * Hàm nhận vào: không nhận props.
 * Hàm xử lý: dựng toàn bộ giao diện landing page homePage cho PTIT HCM Management System.
 * Hàm trả về: JSX hiển thị đầy đủ header, hero, giới thiệu, vai trò, tính năng, quy trình, CTA và footer.
 */
const homePage = () => {
  return (
    <div className={`${inter.className} homePageShell`}>
      <header className="headerBar">
        <div className="contentContainer headerInner">
          <a className="brandBlock" href="#trangChu">
            <span className="brandMark">
              <Image
                src={logoPtitTrang}
                alt="Logo PTIT HCM"
                fill
                sizes="42px"
                className="brandLogoImage"
              />
            </span>
            <span className="brandText">PTIT HCM</span>
          </a>

          <nav className="desktopNav" aria-label="Điều hướng chính">
            {navigationItems.map((navigationItem) => (
              <a
                key={navigationItem.label}
                className="navLink"
                href={navigationItem.href}
              >
                {navigationItem.label}
              </a>
            ))}
          </nav>

          <div className="headerActions">
            {/* Nút đăng nhập tạm thời chuyển về route /login, phần xác thực thật sẽ tích hợp sau. */}
            <Link className="primaryButton smallButton" href="/login">
              Đăng nhập
            </Link>

            <details className="mobileMenu">
              <summary className="menuToggle">
                <span className="menuIcon">{renderLineIcon("menu")}</span>
                <span>Menu</span>
              </summary>
              <nav
                className="mobilePanel"
                aria-label="Điều hướng trên thiết bị nhỏ"
              >
                {navigationItems.map((navigationItem) => (
                  <a
                    key={navigationItem.label}
                    className="mobileNavLink"
                    href={navigationItem.href}
                  >
                    {navigationItem.label}
                  </a>
                ))}
                <Link className="primaryButton mobileLoginButton" href="/login">
                  Đăng nhập
                </Link>
              </nav>
            </details>
          </div>
        </div>
      </header>

      <main className="mainContent">
        <section id="trangChu" className="heroSection sectionBlock">
          <div className="heroMedia">
            <Image
              src={campusBackground}
              alt="Cơ sở PTIT HCM dùng làm nền cho trang giới thiệu hệ thống."
              fill
              priority
              sizes="100vw"
              className="heroImage"
            />
            <div className="heroOverlay" />
            <div className="heroGlow heroGlowTop" />
            <div className="heroGlow heroGlowBottom" />
          </div>

          <div className="contentContainer heroGrid">
            <span className="sectionLabel lightLabel heroLabel">
              HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG CƠ SỞ TẠI THÀNH PHỐ HỒ CHÍ
              MINH
            </span>

            <div className="heroContent">
              <h1 className="heroTitle">
                Hệ thống quản lý lịch thực hành phòng máy PTIT HCM
              </h1>
              <p className="heroDescription">
                Nền tảng hỗ trợ cán bộ đào tạo, giảng viên, kỹ thuật viên và
                sinh viên trong việc phân công, theo dõi và tra cứu lịch thực
                hành phòng máy.
              </p>

              <div className="heroActionsRow">
                {/* Nút bắt đầu chỉ chuyển tạm sang /login, sẽ tích hợp quy trình đăng nhập thật sau. */}
                <Link className="primaryButton heroPrimaryButton" href="/login">
                  Bắt đầu ngay
                </Link>
                <a className="secondaryButton" href="#gioiThieu">
                  Tìm hiểu thêm
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="gioiThieu" className="sectionBlock introSection">
          <div className="contentContainer introGrid">
            <div className="sectionHeading">
              <h2 className="sectionTitle">
                Điều phối lịch thực hành tập trung, rõ ràng và dễ mở rộng
              </h2>
              <p className="sectionDescription">
                Trong thực tế, việc xếp lịch thực hành phòng máy thường gặp
                nhiều khó khăn như trùng phòng, thiếu thiết bị hoặc phải thay
                đổi vào phút chót. Hệ thống được xây dựng nhằm giải quyết triệt
                để những vấn đề đó bằng cách điều phối lịch thực hành một cách
                tập trung, kiểm soát chặt chẽ điều kiện phòng máy và hỗ trợ các
                bên liên quan phối hợp hiệu quả. Nhờ đó, quá trình tổ chức thực
                hành trở nên rõ ràng, ổn định và dễ quản lý hơn.
              </p>
            </div>

            <div className="introPanel">
              {introHighlights.map((introHighlight, index) => (
                <article key={introHighlight.title} className="introCard">
                  <div className="introCardIcon">
                    {renderLineIcon(
                      index === 0 ? "spark" : index === 1 ? "layers" : "clock",
                    )}
                  </div>
                  <div>
                    <h3 className="introCardTitle">{introHighlight.title}</h3>
                    <p className="introCardText">
                      {introHighlight.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="vaiTro" className="sectionBlock">
          <div className="contentContainer">
            <div className="sectionHeading narrowHeading">
              <h2 className="sectionTitle">
                Năm nhóm người dùng cùng làm việc trên một hệ thống thống nhất
              </h2>
              <p className="sectionDescription">
                Mỗi vai trò có đúng thông tin cần thiết để xử lý lịch thực hành
                nhanh hơn, minh bạch hơn và giảm trao đổi thủ công.
              </p>
            </div>

            <div className="roleGrid">
              {roleCards.map((roleCard) => (
                <article key={roleCard.title} className="roleCard">
                  <div className="iconBadge roleIconBadge">
                    {renderLineIcon(roleCard.iconName)}
                  </div>
                  <h3 className="roleTitle">{roleCard.title}</h3>
                  <p className="roleDescription">{roleCard.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="tinhNang" className="sectionBlock featureSection">
          <div className="contentContainer">
            <div className="sectionHeading featureHeading">
              <div>
                <h2 className="sectionTitle">
                  Bao quát đầy đủ nghiệp vụ quản lý lịch thực hành phòng máy
                </h2>
              </div>
              <p className="sectionDescription sideDescription">
                Từ bước tạo yêu cầu xếp lịch đến lúc công bố và xử lý thay đổi,
                mọi thông tin được giữ trong một luồng thao tác nhất quán.
              </p>
            </div>

            <div className="featureGrid">
              {featureCards.map((featureCard) => (
                <article
                  key={featureCard.title}
                  className={`featureCard${featureCard.isFeatured ? " featuredFeatureCard" : ""}`}
                >
                  <div className="iconBadge featureIconBadge">
                    {renderLineIcon(featureCard.iconName)}
                  </div>
                  <h3 className="featureTitle">{featureCard.title}</h3>
                  <p className="featureDescription">
                    {featureCard.description}
                  </p>

                  {featureCard.isFeatured ? (
                    <div className="schedulePreview">
                      <div className="schedulePreviewHeader">
                        <span className="schedulePreviewBadge">
                          Lịch mẫu tuần hiện tại
                        </span>
                        <span className="schedulePreviewMeta">
                          Phòng 2B11, 2B21, 2B31
                        </span>
                      </div>

                      <div className="schedulePreviewTable">
                        <div className="schedulePreviewRow schedulePreviewRowHead">
                          <span>Ca học</span>
                          <span>Thứ 2</span>
                          <span>Thứ 4</span>
                          <span>Thứ 6</span>
                        </div>
                        <div className="schedulePreviewRow">
                          <span>Ca 1</span>
                          <span className="scheduleSlot activeSlot">2B11</span>
                          <span className="scheduleSlot">2B21</span>
                          <span className="scheduleSlot subtleSlot">Trống</span>
                        </div>
                        <div className="schedulePreviewRow">
                          <span>Ca 2</span>
                          <span className="scheduleSlot">2B31</span>
                          <span className="scheduleSlot activeSlot">2B11</span>
                          <span className="scheduleSlot">2B21</span>
                        </div>
                        <div className="schedulePreviewRow">
                          <span>Ca 3</span>
                          <span className="scheduleSlot subtleSlot">
                            Bảo trì
                          </span>
                          <span className="scheduleSlot">2B31</span>
                          <span className="scheduleSlot activeSlot">2B11</span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sectionBlock ctaSection">
          <div className="contentContainer">
            <div className="ctaCard">
              <div className="ctaGlow ctaGlowTop" />
              <div className="ctaGlow ctaGlowBottom" />
              <span className="sectionLabel lightLabel">
                Sẵn sàng triển khai
              </span>
              <h2 className="ctaTitle">
                Sẵn sàng quản lý lịch thực hành hiệu quả hơn?
              </h2>
              <p className="ctaDescription">
                Truy cập hệ thống để chuẩn hóa quá trình xếp lịch, theo dõi thay
                đổi và phối hợp các bên liên quan thuận tiện hơn.
              </p>

              {/* Nút CTA hiện chỉ chuyển sang trang /login mock, chức năng xác thực thật sẽ tích hợp sau. */}
              <Link className="ctaButton" href="/login">
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer id="lienHe" className="footerBlock">
        <div className="contentContainer footerGrid">
          <div className="footerBrandArea">
            <div className="brandBlock footerBrandBlock">
              <span className="brandMark">
                <Image
                  src={logoPtitTrang}
                  alt="Logo PTIT HCM"
                  fill
                  sizes="42px"
                  className="brandLogoImage"
                />
              </span>
              <span className="brandText">PTIT HCM</span>
            </div>
            <p className="footerDescription">
              Hệ thống quản lý lịch thực hành phòng máy dành cho Học viện Công
              nghệ Bưu chính Viễn thông cơ sở TP.HCM, tập trung vào xếp lịch,
              công bố lịch và hỗ trợ phối hợp giữa các vai trò nghiệp vụ.
            </p>
            <p className="footerCopy">
              © 2026 PTIT HCM Management System. Nhóm Hai4.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default homePage;
