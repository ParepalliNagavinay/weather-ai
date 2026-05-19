import { FiSearch } from "react-icons/fi";

const SearchBar = ({ city, setCity, fetchWeather }) => {

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      fetchWeather();
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl items-center gap-3">

      <input
        type="text"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search city..."
        className="
        flex-1
        px-6
        py-4
        rounded-full
        bg-white/20
        text-white
        placeholder-white/70
        outline-none
        text-center
        text-3xl
        font-semibold
        sm:text-4xl
        lg:text-5xl
        min-w-0
        "
      />

      <button
        onClick={fetchWeather}
        className="
        w-14
        h-14
        sm:w-16
        sm:h-16
        shrink-0
        rounded-full
        bg-white/20
        flex
        items-center
        justify-center
        text-white
        text-3xl
        sm:text-3xl
        "
      >
        <FiSearch />
      </button>

    </div>
  );
};

export default SearchBar;
