import { Head } from '@inertiajs/react';
import { MapPin, Users, Calendar, Trophy } from 'lucide-react';

export default function Dashboard({ stats, recentCourts, recentRequests }) {
    return (
        <>
            <Head title="Dashboard" />
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            Dashboard
                        </h1>
                        <p className="text-gray-600">Welcome to Badminton Connect</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Courts</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_courts}</p>
                                </div>
                                <MapPin className="w-12 h-12 text-blue-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Open Requests</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.open_requests}</p>
                                </div>
                                <Users className="w-12 h-12 text-green-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Upcoming Matches</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.upcoming_matches}</p>
                                </div>
                                <Calendar className="w-12 h-12 text-purple-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Matches</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_matches}</p>
                                </div>
                                <Trophy className="w-12 h-12 text-yellow-500" />
                            </div>
                        </div>
                    </div>

                    {/* Recent Courts */}
                    <div className="bg-white rounded-lg shadow mb-8">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">Recent Courts</h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {recentCourts && recentCourts.length > 0 ? (
                                    recentCourts.map((court) => (
                                        <div key={court.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                                            <h3 className="font-semibold text-lg text-gray-900 mb-2">{court.court_name}</h3>
                                            <p className="text-sm text-gray-600 mb-2">{court.address}</p>
                                            {court.rating && (
                                                <div className="flex items-center text-yellow-500">
                                                    <span className="text-sm font-medium">{court.rating}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500">No courts available</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Partner Requests */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">Recent Partner Requests</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {recentRequests && recentRequests.length > 0 ? (
                                    recentRequests.map((request) => (
                                        <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-semibold text-lg text-gray-900">
                                                    {request.creator?.name || 'Unknown'}
                                                </h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    request.mode === 'tournament' 
                                                        ? 'bg-purple-100 text-purple-800' 
                                                        : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {request.mode}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                                <div className="flex items-center">
                                                    <MapPin className="w-4 h-4 mr-1" />
                                                    {request.court?.court_name || 'TBD'}
                                                </div>
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 mr-1" />
                                                    {new Date(request.date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500">No partner requests available</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

