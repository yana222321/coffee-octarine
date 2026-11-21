import { useState, type FormEvent } from "react";
import { useStore } from "./store";

const rooms = [
  {
    name: "MAIN HALL",
    note: "Большие окна, общие столы и розовая стойка",
    image: "/assets/coffee-interior.jpg",
    className: "room-main",
  },
  {
    name: "BREW BAR",
    note: "Место у бариста для тех, кому интересно всё про кофе",
    image: "/assets/coffee-machine.jpg",
    className: "room-dark",
  },
  {
    name: "QUIET ROOM",
    note: "Тихая комната для учёбы, книг и неспешных встреч",
    image: "/assets/coffee-barista.jpg",
    className: "room-wood",
  },
  {
    name: "PINK CORNER",
    note: "Самый фотогеничный стол и мягкий свет",
    image: "/assets/coffee-latte.jpg",
    className: "room-russian",
  },
];

function Star({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`star ${className}`} />;
}

const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

export default function Landing({
  onBook,
  onCatalog,
}: {
  onBook: () => void;
  onCatalog: () => void;
}) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const { stickers, showStickers } = useStore();

  const openBooking = () => {
    setSent(false);
    setBookingOpen(true);
    onBook();
  };

  const submitBooking = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <div className="page-shell">
      <section className="hero" id="home">
        {showStickers && (
          <div className="sticker-layer" aria-hidden="true">
            {stickers.map((sticker) => (
              <span
                key={sticker.id}
                className="sticker-floating"
                style={{
                  left: `${sticker.x}%`,
                  top: `${sticker.y}%`,
                  background: sticker.color,
                  fontSize: sticker.size,
                  transform: `translate(-50%, -50%) rotate(${sticker.rot}deg)`,
                }}
              >
                {sticker.icon}
              </span>
            ))}
          </div>
        )}
        <header className="topbar">
          <a className="mini-logo" href="#/" aria-label="Octarine — на главную">
            <span>О НАС</span>
            <span>КОНТАКТЫ</span>
            <span>АДРЕСА</span>
          </a>
          <button className="top-book" onClick={openBooking}>
            Забронировать стол
          </button>
        </header>

        <nav className="hero-nav" aria-label="Навигация">
          <button type="button" onClick={() => scrollTo("why")}>
            Пробуй
          </button>
          <button type="button" onClick={() => scrollTo("about")}>
            Встречайся
          </button>
          <button type="button" onClick={onCatalog}>
            Возвращайся
          </button>
        </nav>

        <div className="hero-heading">
          <p>Кофейня</p>
          <p>восьмого цвета</p>
        </div>

        <div className="brand-mark" aria-label="OCTARINE">
          {"OCTARINE".split("").map((letter, index) => (
            <span key={`${letter}-${index}`}>{letter}</span>
          ))}
        </div>

        <div className="hero-points">
          <span>
            Зёрна
            <br />
            со всего мира
          </span>
          <span>
            Авторские
            <br />
            напитки
          </span>
          <span>
            Винил и<br />
            события
          </span>
          <span>
            Своя
            <br />
            атмосфера
          </span>
        </div>

        <button className="booking-strip" onClick={openBooking}>
          <span>→</span> Забронировать стол <span>←</span>
        </button>
      </section>

      <section className="about" id="about">
        <div className="about-photo photo-tape">
          <img src="/assets/coffee-barista.jpg" alt="Бариста готовит кофе" />
          <p>
            Октарин — восьмой цвет радуги, который видят только волшебники. Мы решили, что хороший
            кофе работает примерно так же.
          </p>
        </div>
        <div className="about-copy">
          <h2>OCTARINE</h2>
          <p className="about-lead">Это место, где кофе становится маленькой ежедневной магией</p>
          <p className="about-bottom">
            Где не нужно разбираться в нотах вкуса, чтобы выбрать свой любимый кофе
          </p>
        </div>
        <div className="poster">
          <img src="/assets/coffee-latte.jpg" alt="Латте в розовой чашке" />
          <div className="poster-pattern" aria-hidden="true">
            OCTARINE OCTARINE OCTARINE
          </div>
          <span>08:00—22:00</span>
        </div>
        <Star className="about-star-one" />
        <Star className="about-star-two" />
      </section>

      <section className="why" id="why">
        <div className="section-title">
          <h2>Почему</h2>
          <h2>мы</h2>
        </div>
        <p className="partner-note">Работаем с независимыми обжарщиками</p>
        <div className="why-grid">
          <article className="why-card table-card">
            <div className="cutout">
              <img src="/assets/coffee-latte.jpg" alt="Латте в розовой чашке" />
            </div>
            <h3>
              Розовые
              <br />
              чашки
            </h3>
            <p>Их сложно забыть и невозможно перепутать</p>
          </article>
          <article className="why-card bar-card">
            <div className="can-row" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </div>
            <h3>
              Свежее
              <br />
              зерно
            </h3>
            <p>Меняем лоты и настраиваем рецепт каждый день</p>
          </article>
          <article className="why-card vibe-card">
            <div className="cutout portrait">
              <img src="/assets/coffee-machine.jpg" alt="Кофемашина в кофейне" />
            </div>
            <h3>
              Честный
              <br />
              кофе
            </h3>
            <p>Никакого снобизма и сложных слов</p>
          </article>
          <article className="why-card event-card">
            <div className="balls-cutout">
              <img src="/assets/coffee-cups.jpg" alt="Две чашки кофе" />
            </div>
            <h3>
              Живые
              <br />
              события
            </h3>
            <p>Каппинги, лекции, диджей-сеты и встречи</p>
          </article>
        </div>
        <Star className="why-star-one" />
        <Star className="why-star-two" />
      </section>

      <section className="events">
        <div className="event-collage">
          <img
            className="event-photo-one"
            src="/assets/coffee-machine.jpg"
            alt="Кофейное оборудование"
          />
          <img
            className="event-photo-two"
            src="/assets/coffee-interior.jpg"
            alt="Интерьер кофейни"
          />
          <img
            className="event-photo-three"
            src="/assets/coffee-barista.jpg"
            alt="Бариста за работой"
          />
        </div>
        <div className="events-copy">
          <h2>
            Здесь также
            <br />
            проходят
          </h2>
          <div className="event-list">
            <span>
              Каппинги <small>пробуем : обсуждаем : выбираем</small>
            </span>
            <span>
              Фотосъёмки <small>контент : розовый интерьер</small>
            </span>
            <span>Лекции</span>
            <span>
              Дни рождения <small>ваши праздники</small>
            </span>
            <span>Виниловые вечера</span>
          </div>
          <button className="inline-book" onClick={openBooking}>
            Забронировать
          </button>
        </div>
        <Star className="events-star" />
      </section>

      <section className="rooms" id="rooms">
        <div className="rooms-grid">
          {rooms.map((room) => (
            <article className={`room-card ${room.className}`} key={room.name}>
              <img src={room.image} alt="" />
              {room.className === "room-main" && (
                <div>
                  <h3>{room.name}</h3>
                  <p>{room.note}</p>
                </div>
              )}
            </article>
          ))}
        </div>
        <div className="room-captions">
          {[rooms[1], rooms[3], rooms[2]].map((room) => (
            <div className="room-caption" key={room.name}>
              <h3>{room.name}</h3>
              <p>{room.note}</p>
            </div>
          ))}
        </div>
        <footer>
          <strong>OCTARINE</strong>
          <div>
            <a href="#/">Наверх</a>
            <button onClick={onCatalog}>Каталог</button>
            <button onClick={openBooking}>Бронь</button>
            <a href="mailto:hello@octarine.cafe">Контакты</a>
          </div>
        </footer>
      </section>

      {bookingOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setBookingOpen(false)}
        >
          <section
            className="booking-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setBookingOpen(false)}
              aria-label="Закрыть"
            >
              ×
            </button>
            {sent ? (
              <div className="success-message">
                <p>Заявка принята</p>
                <h2>
                  До встречи
                  <br />в OCTARINE!
                </h2>
                <button onClick={() => setBookingOpen(false)}>Закрыть</button>
              </div>
            ) : (
              <>
                <p className="modal-kicker">Бронирование столика</p>
                <h2 id="booking-title">
                  Выпьем
                  <br />
                  кофе?
                </h2>
                <form onSubmit={submitBooking}>
                  <label>
                    Имя
                    <input name="name" autoFocus required placeholder="Как к вам обращаться" />
                  </label>
                  <label>
                    Телефон
                    <input name="phone" type="tel" required placeholder="+7 999 000-00-00" />
                  </label>
                  <label>
                    Когда
                    <input name="date" type="date" required />
                  </label>
                  <button type="submit">Отправить заявку →</button>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
