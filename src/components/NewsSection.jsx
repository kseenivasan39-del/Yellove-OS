import React from 'react';

/**
 * NewsSection Component - Accurately replicates the Chennai Super Kings website news layout.
 * Features 2026 season updates, merchandise ads, and player spotlights.
 */
const NewsSection = () => {
    const newsUrls = {
        main: "https://www.chennaisuperkings.com/news",
        srh: "https://www.chennaisuperkings.com/news/newsdetailspage/5720/3",
        injury: "https://www.chennaisuperkings.com/news/newsdetailspage/5718/3",
        samson: "https://www.chennaisuperkings.com/news/newsdetailspage/5715/3",
        jersey: "https://www.chennaisuperkings.com/Jersey/JERSEY-2026",
        main: "https://www.chennaisuperkings.com/news"
    };

    const openLink = (url) => window.open(url, '_blank', 'noreferrer');

    return (
        <section className="mt-20 mb-12 px-4 md:px-8 max-w-7xl mx-auto" aria-label="CSK Official News">
            <div className="mb-8 border-b-2 border-white/10 pb-2 flex justify-between items-end">
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">News</h2>
                <button 
                    onClick={() => openLink(newsUrls.main)}
                    className="text-[11px] font-black text-white uppercase flex items-center gap-2 hover:translate-x-1 transition-transform mb-1"
                >
                    All News <i className="fas fa-arrow-right"></i>
                </button>
            </div>

            {/* Top Grid: Major Articles & Ads */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-5">
                
                {/* Featured Piece (Match Preview) */}
                <div className="md:col-span-3">
                    <div 
                        onClick={() => openLink(newsUrls.srh)}
                        className="bg-[#F9CD05] rounded-lg overflow-hidden flex flex-col h-full shadow-lg group cursor-pointer border border-yellow-400"
                    >
                        <div className="relative aspect-[3/4]">
                            <img 
                                src="/images/khaleel_ahmed_injury.png" 
                                alt="Match Preview" 
                                loading="eager"
                                fetchpriority="high"
                                decoding="async"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="p-4 flex flex-col flex-1">
                            <h3 className="text-xl font-black text-[#002B61] leading-tight mb-4 group-hover:underline">
                                IPL 2026 Preview: Super Kings take on SRH in Hyderabad
                            </h3>
                            <div className="mt-auto">
                                <p className="text-[11px] text-[#002B61]/70 font-bold mb-2">April 18, 2026 Chennai Super Kings will clash with Sunrisers Hyderabad in Match No. 27 of IPL 2026... </p>
                                <button className="text-[12px] font-black text-[#002B61] uppercase flex items-center gap-1">
                                    View More <i className="fas fa-chevron-right text-[10px]"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vertical Center Stack */}
                <div className="md:col-span-3 flex flex-col gap-5">
                    {/* Thala Forever Banner */}
                    <div 
                        onClick={() => openLink(newsUrls.main)}
                        className="rounded-lg overflow-hidden h-32 bg-[#002B61] relative group cursor-pointer border border-blue-800 shadow-lg"
                    >
                        <img 
                            src="/images/thala_forever_banner.png" 
                            alt="Thala Forever"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    </div>

                    {/* Injury Report Card */}
                    <div 
                        onClick={() => openLink(newsUrls.injury)}
                        className="bg-white rounded-lg overflow-hidden flex flex-col flex-1 shadow-lg border border-gray-100 group cursor-pointer"
                    >
                        <div className="relative h-44 aspect-video">
                            <img 
                                src="/images/sanju_samson_celebration.png" 
                                alt="Khaleel Ahmed"
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                            />
                        </div>
                        <div className="p-4">
                            <h3 className="text-base font-black text-[#002B61] leading-tight mb-3 group-hover:text-blue-700">
                                IPL 2026: Khaleel Ahmed ruled out of tournament due to...
                            </h3>
                            <p className="text-[10px] text-gray-400 font-bold mb-3 uppercase">April 16, 2026 Chennai Super Kings' pacer Khaleel Ahmed has been ruled out of IPL 2026...</p>
                            <button className="text-[11px] font-black text-[#002B61] uppercase">View More</button>
                        </div>
                    </div>
                </div>

                {/* Large Jersey Ad */}
                <div className="md:col-span-6">
                    <div 
                        onClick={() => openLink(newsUrls.jersey)}
                        className="bg-[#F9CD05] rounded-xl flex items-center justify-between p-10 h-full relative overflow-hidden shadow-xl border border-yellow-400 group cursor-pointer"
                    >
                        <div className="relative z-10 w-1/2">
                            <h3 className="text-3xl font-black text-[#002B61] italic leading-none mb-2">ALL-NEW</h3>
                            <h2 className="text-5xl font-black text-[#002B61] italic leading-none mb-8 tracking-tighter">CSK JERSEY 2026</h2>
                            <button className="bg-[#002B61] text-white px-8 py-3 rounded text-xl font-black uppercase italic shadow-lg hover:scale-105 transition-transform">
                                Buy Now
                            </button>
                        </div>
                        <div className="absolute right-0 top-0 w-full h-full">
                            <img 
                                src="/images/csk_jersey_crest.png" 
                                alt="Jersey Detail" 
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-1000" 
                            />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#F9CD05] via-[#F9CD05]/40 to-transparent z-[5]"></div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Player Highlight - Now using SRH preview image */}
            <div 
                onClick={() => openLink(newsUrls.samson)} 
                className="bg-white rounded-lg shadow-lg border border-gray-100 flex flex-col md:flex-row overflow-hidden group cursor-pointer min-h-[300px]"
            >
                <div className="md:w-1/2 relative h-80 md:h-auto overflow-hidden">
                    <img 
                        src="/images/csk_srh_ready_to_rise.png" 
                        alt="Sanju Samson Spotlight"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover md:object-top group-hover:scale-105 transition-transform duration-700"
                    />
                    </div>
                <div className="md:w-1/2 p-8 flex flex-col justify-center">
                    <h3 className="text-2xl font-black text-[#002B61] leading-tight mb-4 group-hover:text-blue-800 uppercase italic">
                        ‘I am very happy that I contributed’ - Sanju Samson
                    </h3>
                    <p className="text-xs text-gray-500 font-bold mb-4 uppercase tracking-tighter leading-relaxed">
                        April 13, 2026 Sanju Samson scored a sparkling 56-ball 115* against Delhi Capitals at Chennai, helped the Chennai Super Kings...
                    </p>
                    <button className="text-sm font-black text-[#002B61] uppercase flex items-center gap-1 border-b-2 border-[#002B61] w-max group-hover:translate-x-2 transition-transform">
                        View More
                    </button>
                </div>
            </div>
        </section>
    );
};

export default NewsSection;
