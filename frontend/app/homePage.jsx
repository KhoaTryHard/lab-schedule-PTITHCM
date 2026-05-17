"use client";
import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";

import { renderLineIcon } from "../components/systemIcon.jsx";
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
              nghệ Bưu chính Viễn thông cơ sở thành phố Hồ Chí Minh.
            </p>
            <p className="footerCopy">© 2026 PTITHCM GROUP HAI4</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default homePage;
