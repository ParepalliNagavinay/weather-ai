const ForecastCard = ({ forecast, darkMode }) => {
  const visibleForecast = forecast.slice(0, 7);

  return (
  <div
  className={`
    h-full
    rounded-3xl
    p-4
    transition-all
    duration-500
    ${
      darkMode
        ? "bg-white/10 text-white"
        : "bg-black/10 text-black"
    }
  `}
>
     <h2 className="text-4xl font-extrabold text-center mb-8 sm:text-5xl">
        7-Day Forecast
      </h2>

      <div className="flex flex-col gap-5 lg:max-h-[700px] lg:overflow-y-auto lg:pr-2 mt-4">

        {visibleForecast.map((day, index) => (

          <div
            key={index}
className={`
  flex
  justify-between
  items-center
  rounded-3xl
  px-6
  py-5
  backdrop-blur-xl
  gap-6
  transition-all
  duration-300
  ${
    darkMode
      ? "bg-white/10 text-white"
      : "bg-black/10 text-black"
  }
`}
          >

            <h3 className="min-w-16 text-2xl font-bold">
              {new Date(day.dt_txt).toLocaleDateString("en-US", {
                weekday: "short",
              })}
            </h3>

          <img
  src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`}
  alt=""
  className="w-16 h-16"
/>

            <p className="min-w-32 text-right text-2xl font-bold">
              {Math.round(day.main.temp_max)}&deg; / {Math.round(day.main.temp_min)}&deg;C
            </p>

          </div>
        ))}

      </div>

    </div>
  );
};

export default ForecastCard;
