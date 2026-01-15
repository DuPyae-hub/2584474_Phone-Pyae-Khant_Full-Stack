import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { MapPin, Calendar, Clock, User, Trophy, Gamepad2, Search, UserPlus, CheckCircle2 } from 'lucide-react';

export default function PartnersIndex({ requests, filters }) {
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [levelFilter, setLevelFilter] = useState(filters?.level || 'all');
    const [modeFilter, setModeFilter] = useState(filters?.mode || 'all');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');

    const joinRequest = (requestId) => {
        router.post(`/partner-requests/${requestId}/join`, {}, {
            preserveScroll: true,
        });
    };

    const markArrived = (requestId) => {
        router.post(`/partner-requests/${requestId}/arrived`, {}, {
            preserveScroll: true,
        });
    };

    const filteredRequests = requests?.filter(request => {
        const creatorName = request.creator?.profile?.name || '';
        const courtName = request.court?.court_name || '';
        const matchesSearch = 
            creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            courtName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLevel = levelFilter === 'all' || request.creator?.profile?.level === levelFilter;
        const matchesMode = modeFilter === 'all' || request.mode === modeFilter;
        const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
        return matchesSearch && matchesLevel && matchesMode && matchesStatus;
    }) || [];

    const getLevelColor = (level) => {
        switch (level) {
            case 'beginner': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'intermediate': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'advanced': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'matched': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'arrived': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'completed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    return (
        <>
            <Head title="Partner Requests" />
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            Partner <span className="text-blue-600">Requests</span>
                        </h1>
                        <p className="text-gray-600">Browse open requests or create your own</p>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow p-4 mb-8">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by player or court..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <select
                                value={levelFilter}
                                onChange={(e) => setLevelFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Levels</option>
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                            <select
                                value={modeFilter}
                                onChange={(e) => setModeFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Types</option>
                                <option value="friendly">Friendly</option>
                                <option value="tournament">Tournament</option>
                            </select>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Status</option>
                                <option value="open">Open</option>
                                <option value="matched">Matched</option>
                                <option value="arrived">Arrived</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>

                    {/* Requests List */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredRequests.length > 0 ? (
                            filteredRequests.map((request) => {
                                const activeParticipants = request.participants?.filter(p => p.status !== 'cancelled') || [];
                                const canJoin = request.status === 'open' && activeParticipants.length < request.players_needed;

                                return (
                                    <div key={request.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white">
                                                        {(request.creator?.profile?.name || '??').slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-lg text-gray-900">
                                                            {request.creator?.profile?.name || 'Unknown'}
                                                        </h3>
                                                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getLevelColor(request.creator?.profile?.level)}`}>
                                                            {request.creator?.profile?.level || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1 items-end">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                                        request.mode === 'tournament' 
                                                            ? 'bg-purple-100 text-purple-800' 
                                                            : 'bg-green-100 text-green-800'
                                                    }`}>
                                                        {request.mode === 'tournament' ? (
                                                            <><Trophy className="w-3 h-3" /> Tournament</>
                                                        ) : (
                                                            <><Gamepad2 className="w-3 h-3" /> Friendly</>
                                                        )}
                                                    </span>
                                                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(request.status)}`}>
                                                        {request.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-blue-500" />
                                                    <span className="truncate">{request.court?.court_name || 'TBD'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-blue-500" />
                                                    <span>{new Date(request.date).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-blue-500" />
                                                    <span>{request.time}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-blue-500" />
                                                    <span>{activeParticipants.length}/{request.players_needed} joined</span>
                                                </div>
                                            </div>

                                            {canJoin && (
                                                <button
                                                    onClick={() => joinRequest(request.id)}
                                                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                                                >
                                                    <UserPlus className="w-4 h-4" />
                                                    Join Request
                                                </button>
                                            )}

                                            {request.status === 'matched' && (
                                                <button
                                                    onClick={() => markArrived(request.id)}
                                                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Mark as Arrived
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-2 text-center py-16">
                                <p className="text-gray-500 text-lg">No requests found</p>
                                <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

