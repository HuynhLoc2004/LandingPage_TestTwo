import React from 'react';
import { X, Heart, Trash2, Cpu, Wifi, Layers } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const FavoriteProducts = ({ favorites, toggleFavorite, darkMode, onClose }) => {
    return (
        <div
            className={twMerge(
                "fixed top-0 right-0 h-full w-full max-w-md z-50 flex flex-col shadow-2xl backdrop-blur-md",
                darkMode
                    ? "bg-slate-900/95 border-l border-slate-800 text-slate-100"
                    : "bg-white/95 border-l border-slate-200 text-slate-900",
            )}
        >
            <div className="flex items-center justify-between p-6 border-b border-slate-500/10">
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                    Favorites List
                </h2>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-slate-500/10 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
                {favorites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Heart className="w-12 h-12 mb-4 text-slate-500/80 animate-pulse" />
                        <h3 className="font-semibold text-lg">No favorites yet</h3>
                        <p className="text-sm text-slate-400 mt-1">
                            Your favorite items will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {favorites.map((product) => (
                            <div
                                key={product.productId}
                                className={twMerge(
                                    "group relative flex flex-col gap-4 p-4 rounded-2xl border transition-all duration-300",
                                    darkMode
                                        ? "bg-slate-800/40 border-slate-800 hover:bg-slate-800/70 hover:border-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                                        : "bg-slate-50 border-slate-200/80 hover:bg-white hover:border-emerald-500/20 hover:shadow-[0_10px_20px_rgba(0,0,0,0.02)]"
                                )}
                            >
                                <div className="flex gap-4 items-start">
                                    <div className="relative overflow-hidden w-20 h-20 rounded-xl bg-slate-500/10 flex-shrink-0">
                                        <img
                                            src={product.imageUrl}
                                            alt={product.productName}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="font-semibold text-base tracking-tight truncate">
                                                {product.productName}
                                            </h4>
                                            <button
                                                onClick={() => toggleFavorite(product.productId)}
                                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                                title="Remove from favorites"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-lg font-bold text-emerald-500 mt-1">
                                            ${product.price?.toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Tech Specs Grid */}
                                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-500/10 text-xs">
                                    {product.chipsetArch && (
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <Cpu className="w-3.5 h-3.5 text-emerald-500/70" />
                                            <span className="truncate" title={product.chipsetArch}>{product.chipsetArch}</span>
                                        </div>
                                    )}
                                    {product.wirelessNetwork && (
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <Wifi className="w-3.5 h-3.5 text-emerald-500/70" />
                                            <span className="truncate" title={product.wirelessNetwork}>{product.wirelessNetwork}</span>
                                        </div>
                                    )}
                                    {product.protocols && (
                                        <div className="flex items-center gap-1.5 text-slate-400 col-span-2">
                                            <Layers className="w-3.5 h-3.5 text-emerald-500/70" />
                                            <span className="truncate" title={product.protocols}>{product.protocols}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FavoriteProducts;