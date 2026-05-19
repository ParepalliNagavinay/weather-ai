import { FaTemperatureHigh, FaTint, FaWind } from "react-icons/fa";

const WeatherCard = ({ weather, darkMode }) => {
  return (
    <div
      className={`
  rounded-[28px]
  h-full
  p-4
  sm:p-5
  transition-all
  duration-500
${
  darkMode
    ? "bg-gray-800 text-white"
    : "bg-gray-100 text-black"
}
`}
    >
      <div className="flex justify-center gap-4">
        <img
          src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
          alt=""
          className="h-24 w-24 object-contain sm:h-28 sm:w-28 lg:h-32 lg:w-32"
        />
      </div>

      <div className="text-center">
        <h1 className="text-4xl font-bold sm:text-5xl">
          {Math.round(weather.main.temp)}&deg;C
        </h1>

        <p
  className={`
    text-3xl
    sm:text-4xl
    lg:text-5xl
    font-medium
    break-words
  ${
  darkMode
    ? "bg-gray-800 text-white"
    : "bg-gray-100 text-black"
}
  `}
>{weather.name}</p>

        <p
  className={`
    text-lg
    mt-1
   ${
  darkMode
    ? "bg-gray-800 text-white"
    : "bg-gray-100 text-black"
}
  `}
>
          {weather.weather[0].description}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full mt-8">
      <div
  className={`
    rounded-2xl
    p-3
    sm:p-4
    flex
    flex-col
    items-center
    text-center
    min-w-0
    ${
      darkMode
        ? "bg-gray-700 text-white"
        : "bg-gray-100 text-black"
    }
  `}
>
          <FaTint className="mx-auto text-2xl mb-2" />
          <p className="text-sm">Humidity</p>
          <h2 className="font-bold">{weather.main.humidity}%</h2>
        </div>
<div
  className={`
    rounded-2xl
    p-3
    sm:p-4
    flex
    flex-col
    items-center
    text-center
    min-w-0
   ${
  darkMode
    ? "bg-gray-800 text-white"
    : "bg-gray-100 text-black"
}
  `}
>
          <FaWind className="mx-auto text-2xl mb-2" />
          <p className="text-sm">Wind</p>
          <h2 className="font-bold">
            {Math.round(weather.wind.speed * 3.6)} km/h
          </h2>
        </div>

       <div
  className={`
    rounded-2xl
    p-3
    sm:p-4
    flex
    flex-col
    items-center
    text-center
    min-w-0
    ${
      darkMode
        ? "bg-gray-700 text-white"
        : "bg-gray-100 text-black"
    }
  `}
>
          <FaTemperatureHigh className="mx-auto text-2xl mb-2" />
          <p className="text-sm">Feels</p>
          <h2 className="text-xl font-semibold sm:text-2xl">
            {Math.round(weather.main.feels_like)}&deg;C
          </h2>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
