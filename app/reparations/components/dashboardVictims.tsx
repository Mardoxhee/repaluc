"use client";
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid, AreaChart, Area } from 'recharts';
import { FiUsers, FiShield, FiMapPin, FiAward, FiDollarSign, FiTrendingUp, FiAlertTriangle, FiCheckCircle, FiWifi, FiWifiOff } from 'react-icons/fi';
import { FaHospitalSymbol, FaUserCheck, FaBalanceScale } from "react-icons/fa";
import { BsFillHousesFill } from "react-icons/bs";
import { useFetch } from '../../context/FetchContext';
import { saveToCache, getFromCache, isOnline } from '../../utils/dashboardCache';

const COLORS = ["#007fba", "#7f2360", "#0066cc", "#cc3366", "#0080ff", "#ff6b9d", "#4da6ff", "#ff8fab", "#80bfff", "#ffb3d1"];

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  trend?: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle, trend, loading }) => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-3 rounded-xl ${color} shadow-md group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-end gap-2">
          {loading ? (
            <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
          ) : (
            <span className="text-3xl font-bold text-gray-900">{value}</span>
          )}
          {trend && (
            <span className="text-sm font-medium text-green-600 mb-1">{trend}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

const DashboardVictims = () => {
  const { fetcher } = useFetch();
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [usingCache, setUsingCache] = useState(false);
  const [showOfflineIndicator, setShowOfflineIndicator] = useState(true);
  type SexeStat = { sexe: string; total: number };
  const [stats, setStats] = useState<{
    sexe: SexeStat[];
    trancheAge: any[];
    province: any[];
    programme: any[];
    territoire: any[];
    prejudiceFinal: any[];
    totalIndemnisation: number;
    categorie: any[];
    prejudice: any[];
  }>({
    sexe: [],
    trancheAge: [],
    province: [],
    programme: [],
    territoire: [],
    prejudiceFinal: [],
    totalIndemnisation: 0,
    categorie: [],
    prejudice: []
  });

  useEffect(() => {
    const fetchAllStats = async () => {
      setLoading(true);
      setIsOffline(!isOnline());
      setUsingCache(false);

      // Essayer de charger depuis le cache d'abord
      const cacheKey = 'dashboard-stats';
      const cachedData = await getFromCache(cacheKey);

      if (cachedData && !isOnline()) {
        // Utiliser le cache si offline
        console.log('[Dashboard] Mode offline - Utilisation du cache');
        setStats(cachedData);
        setUsingCache(true);
        setLoading(false);
        return;
      }

      if (cachedData && isOnline()) {
        // Afficher le cache immédiatement puis rafraîchir en arrière-plan
        console.log('[Dashboard] Affichage du cache puis rafraîchissement');
        setStats(cachedData);
        setUsingCache(true);
        setLoading(false);
      }

      // Essayer de charger depuis le serveur
      if (isOnline()) {
        try {
          const [
            sexeData,
            trancheAgeData,
            provinceData,
            programmeData,
            territoireData,
            prejudiceFinalData,
            totalIndemnisationData,
            categorieData,
            prejudiceData
          ] = await Promise.all([
            fetcher('/victime/stats/sexe'),
            fetcher('/victime/stats/tranche-age'),
            fetcher('/victime/stats/province'),
            fetcher('/victime/stats/programme'),
            fetcher('/victime/stats/territoire'),
            fetcher('/victime/stats/prejudice-final'),
            fetcher('/victime/stats/total-indemnisation'),
            fetcher('/victime/stats/categorie'),
            fetcher('/victime/stats/prejudice')
          ]);

          const newStats = {
            sexe: sexeData || [],
            trancheAge: trancheAgeData || [],
            province: provinceData || [],
            programme: programmeData || [],
            territoire: territoireData || [],
            prejudiceFinal: prejudiceFinalData || [],
            totalIndemnisation: totalIndemnisationData?.totalIndemnisation || 0,
            categorie: categorieData || [],
            prejudice: prejudiceData || []
          };

          setStats(newStats);
          setUsingCache(false);

          // Sauvegarder dans le cache
          await saveToCache(cacheKey, newStats);
          console.log('[Dashboard] Données sauvegardées dans le cache');
        } catch (error) {
          console.log('[Dashboard] Erreur chargement serveur:', error);

          // Si erreur et pas de cache, essayer de charger le cache expiré
          if (!cachedData) {
            const expiredCache = await getFromCache(cacheKey);
            if (expiredCache) {
              console.log('[Dashboard] Utilisation du cache expiré');
              setStats(expiredCache);
              setUsingCache(true);
            }
          }
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAllStats();

    // Écouter les changements de connexion
    const handleOnline = () => {
      setIsOffline(false);
      fetchAllStats();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetcher]);

  // Calculs des totaux
  const totalVictimes = stats.sexe.reduce((acc, item: any) => acc + parseInt(item.total), 0);
  const totalFemmes = stats.sexe.find((item: any) => item.sexe === 'Femme')?.total || 0;
  const totalHommes = stats.sexe.find((item: any) => item.sexe === 'Homme')?.total || 0;
  const totalProvinces = stats.province.length;
  const totalTerritoires = stats.territoire.length;

  // Préparation des données pour les graphiques
  const sexeChartData = stats.sexe.map((item: any, index) => ({
    name: item.sexe,
    value: parseInt(item.total),
    color: COLORS[index % COLORS.length]
  }));

  const provinceChartData = stats.province.map((item: any, index) => ({
    name: item.province,
    value: parseInt(item.total),
    color: COLORS[index % COLORS.length]
  }));

  const prejudiceChartData = stats.prejudiceFinal.map((item: any, index) => ({
    name: item.prejudiceFinal.length > 30 ? item.prejudiceFinal.substring(0, 30) + '...' : item.prejudiceFinal,
    fullName: item.prejudiceFinal,
    value: parseInt(item.total),
    color: COLORS[index % COLORS.length]
  }));

  const programmeChartData = stats.programme.map((item: any, index) => ({
    name: item.programme.length > 40 ? item.programme.substring(0, 40) + '...' : item.programme,
    fullName: item.programme,
    value: parseInt(item.total),
    color: COLORS[index % COLORS.length]
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{data.fullName || data.name}</p>
          <p className="text-blue-600">
            <span className="font-medium">Total: {data.value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full px-6 py-8 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de Bord des Victimes</h1>
            <p className="text-gray-600">Vue d'ensemble des données et statistiques du système FONAREV</p>
          </div>

          {/* Indicateur de statut */}
          {(isOffline || usingCache) && showOfflineIndicator && (
            <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${isOffline
              ? 'bg-orange-50 text-orange-800 border-orange-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}>
              {isOffline ? (
                <>
                  <FiWifiOff size={18} />
                  <span className="text-sm font-medium">Mode Hors Ligne</span>
                </>
              ) : (
                <>
                  <FiWifi size={18} />
                  <span className="text-sm font-medium">Données en cache</span>
                </>
              )}
              <button
                onClick={() => setShowOfflineIndicator(false)}
                className="ml-2 p-1 hover:bg-white/50 rounded transition-colors"
                title="Fermer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notification discrète si l'indicateur est fermé */}
      {(isOffline || usingCache) && !showOfflineIndicator && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setShowOfflineIndicator(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg border ${isOffline
              ? 'bg-orange-100 text-orange-800 border-orange-300'
              : 'bg-blue-100 text-blue-800 border-blue-300'
              } hover:scale-105 transition-transform`}
            title={isOffline ? "Mode Hors Ligne" : "Données en cache"}
          >
            {isOffline ? <FiWifiOff size={16} /> : <FiWifi size={16} />}
          </button>
        </div>
      )}

      {/* Cartes de statistiques principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Victimes"
          value={loading ? "..." : totalVictimes.toLocaleString()}
          icon={<FiUsers className="text-white text-xl" />}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          subtitle="Victimes enregistrées"
          loading={loading}
        />

        <StatCard
          title="Indemnisation Totale"
          value={loading ? "..." : `${stats.totalIndemnisation.toLocaleString()} USD`}
          icon={<FiDollarSign className="text-white text-xl" />}
          color="bg-gradient-to-br from-green-500 to-green-600"
          subtitle="Montant total d'indemnisations estimées"
          loading={loading}
        />

        <StatCard
          title="Provinces Couvertes"
          value={loading ? "..." : totalProvinces}
          icon={<FiMapPin className="text-white text-xl" />}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          subtitle="Zones géographiques"
          loading={loading}
        />

        <StatCard
          title="Territoires"
          value={loading ? "..." : totalTerritoires}
          icon={<BsFillHousesFill className="text-white text-xl" />}
          color="bg-gradient-to-br from-pink-500 to-pink-600"
          subtitle="Territoires actifs"
          loading={loading}
        />
      </div>

      {/* Cartes de répartition par sexe */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <StatCard
          title="Victimes Femmes"
          value={loading ? "..." : totalFemmes}
          icon={<FaUserCheck className="text-white text-xl" />}
          color="bg-gradient-to-br from-pink-400 to-pink-500"
          subtitle={`${totalVictimes > 0 ? Math.round((totalFemmes / totalVictimes) * 100) : 0}% du total`}
          loading={loading}
        />

        <StatCard
          title="Victimes Hommes"
          value={loading ? "..." : totalHommes}
          icon={<FaUserCheck className="text-white text-xl" />}
          color="bg-gradient-to-br from-blue-400 to-blue-500"
          subtitle={`${totalVictimes > 0 ? Math.round((totalHommes / totalVictimes) * 100) : 0}% du total`}
          loading={loading}
        />
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Répartition par sexe */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-50">
              <FiUsers className="text-blue-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Répartition par Sexe</h3>
          </div>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={sexeChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {sexeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Répartition par province */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-50">
              <FiMapPin className="text-purple-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Victimes par Province</h3>
          </div>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={provinceChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {provinceChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Graphiques secondaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Types de préjudices */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-red-50">
              <FiAlertTriangle className="text-red-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Types de Préjudices</h3>
          </div>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={prejudiceChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ value }) => value}
                >
                  {prejudiceChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Programmes de réparation */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-green-50">
              <FiAward className="text-green-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Programmes de Réparation</h3>
          </div>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={programmeChartData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  fontSize={11}
                  interval={0}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tableaux de données détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Répartition par territoire */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-indigo-50">
              <BsFillHousesFill className="text-indigo-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Victimes par Territoire</h3>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-4 bg-gray-200 animate-pulse rounded"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {stats.territoire.map((item: any, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="font-medium text-gray-800">{item.territoire}</span>
                  </div>
                  <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {item.total}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Répartition par catégorie */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-yellow-50">
              <FiShield className="text-yellow-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Catégories de Victimes</h3>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-4 bg-gray-200 animate-pulse rounded"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {stats.categorie.map((item: any, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="font-medium text-gray-800 text-sm">{item.categorie}</span>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {item.total}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section de résumé */}
      <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <FiTrendingUp className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold">Résumé Exécutif</h3>
            <p className="text-blue-100">Aperçu global du système FONAREV</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">{loading ? "..." : totalVictimes}</div>
            <div className="text-blue-100 text-sm">Victimes totales enregistrées</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">{loading ? "..." : `${stats.totalIndemnisation.toLocaleString()} USD`}</div>
            <div className="text-blue-100 text-sm">d'indemnisations estimées</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">{loading ? "..." : `${totalProvinces} provinces`}</div>
            <div className="text-blue-100 text-sm">Couverture géographique</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardVictims;