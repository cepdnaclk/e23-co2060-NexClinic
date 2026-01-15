function NewsCard() {
    return (
        <div title="news-card" className="relative flex sm:flex-row gap-4 p-2 shadow-lg mx-3 my-1 rounded-lg bg-white dark:bg-gray-700">
            <img
                className="relative w-1/3 object-cover"
                src="/images/doc.jpg"
                alt="main-news"
            />
            <div title="news-title">
                <h3 className="font-semibold text-black dark:text-white">Health Benefits of Regular Exercise</h3>
                <p className="text-gray-600 text-sm dark:text-gray-300">Discover how regular physical activity can improve your overall health and well-being.</p>
            </div>
        </div>
    )
}

export default NewsCard;