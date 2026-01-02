'use client';

import { useState } from 'react';
import { 
  Building2, 
  Coins, 
  Calendar, 
  TrendingUp, 
  Hammer, 
  Home,
  ShoppingCart,
  Users,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Typen
type PropertyStatus = 'for_sale' | 'owned' | 'renovating' | 'rented';

interface Property {
  id: number;
  name: string;
  purchasePrice: number;
  condition: number; // 0-100%
  renovationCost: number;
  potentialRent: number;
  status: PropertyStatus;
}

export default function ImmoTycoon() {
  // Globaler Spiel-Status
  const [cash, setCash] = useState(25000);
  const [day, setDay] = useState(1);
  const [week, setWeek] = useState(1);
  const [monthlyIncome, setMonthlyIncome] = useState(0);

  // Immobilien am Markt
  const [marketProperties, setMarketProperties] = useState<Property[]>([
    {
      id: 1,
      name: '🚗 Winzige Garage',
      purchasePrice: 8000,
      condition: 30,
      renovationCost: 2000,
      potentialRent: 250,
      status: 'for_sale'
    },
    {
      id: 2,
      name: '🏚️ Verschimmeltes Apartment',
      purchasePrice: 15000,
      condition: 20,
      renovationCost: 5000,
      potentialRent: 650,
      status: 'for_sale'
    },
    {
      id: 3,
      name: '🏠 Altes Reihenhaus',
      purchasePrice: 22000,
      condition: 40,
      renovationCost: 8000,
      potentialRent: 1200,
      status: 'for_sale'
    },
    {
      id: 4,
      name: '🏢 Heruntergekommenes Loft',
      purchasePrice: 35000,
      condition: 25,
      renovationCost: 12000,
      potentialRent: 1800,
      status: 'for_sale'
    }
  ]);

  // Spieler Portfolio
  const [portfolio, setPortfolio] = useState<Property[]>([]);

  // Kaufen-Funktion
  const buyProperty = (property: Property) => {
    if (cash >= property.purchasePrice) {
      setCash(cash - property.purchasePrice);
      setPortfolio([...portfolio, { ...property, status: 'owned' }]);
      setMarketProperties(marketProperties.filter(p => p.id !== property.id));
    }
  };

  // Renovieren-Funktion
  const renovateProperty = (propertyId: number) => {
    const property = portfolio.find(p => p.id === propertyId);
    if (!property || cash < property.renovationCost) return;

    if (property.condition < 100) {
      setCash(cash - property.renovationCost);
      setPortfolio(portfolio.map(p => 
        p.id === propertyId 
          ? { ...p, condition: Math.min(100, p.condition + 25), status: 'renovating' as PropertyStatus }
          : p
      ));

      // Nach kurzer "Arbeit" wieder auf owned setzen
      setTimeout(() => {
        setPortfolio(prev => prev.map(p => 
          p.id === propertyId && p.condition === 100
            ? { ...p, status: 'owned' }
            : p.id === propertyId
            ? { ...p, status: 'owned' }
            : p
        ));
      }, 1000);
    }
  };

  // Vermieten-Funktion
  const rentProperty = (propertyId: number) => {
    const property = portfolio.find(p => p.id === propertyId);
    if (!property || property.condition < 100) return;

    setPortfolio(portfolio.map(p => 
      p.id === propertyId 
        ? { ...p, status: 'rented' }
        : p
    ));

    // Monatliches Einkommen aktualisieren
    setMonthlyIncome(monthlyIncome + property.potentialRent);
  };

  // Zeit voranschreiten
  const nextMonth = () => {
    // Mieteinnahmen gutschreiben
    const rentedProperties = portfolio.filter(p => p.status === 'rented');
    const totalRent = rentedProperties.reduce((sum, p) => sum + p.potentialRent, 0);
    setCash(cash + totalRent);

    // Zeit aktualisieren
    setDay(day + 30);
    setWeek(week + 4);
  };

  // Status-Badge Komponente
  const StatusBadge = ({ status }: { status: PropertyStatus }) => {
    const statusConfig = {
      for_sale: { text: 'Zu verkaufen', color: 'bg-blue-500/20 text-blue-400', icon: ShoppingCart },
      owned: { text: 'Im Besitz', color: 'bg-emerald-500/20 text-emerald-400', icon: Home },
      renovating: { text: 'Wird renoviert', color: 'bg-amber-500/20 text-amber-400', icon: Hammer },
      rented: { text: 'Vermietet', color: 'bg-purple-500/20 text-purple-400', icon: Users }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={12} />
        {config.text}
      </span>
    );
  };

  // Fortschrittsbalken Komponente
  const ConditionBar = ({ condition }: { condition: number }) => {
    const color = condition >= 100 ? 'bg-emerald-500' : condition >= 50 ? 'bg-amber-500' : 'bg-red-500';
    
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-slate-400">Zustand</span>
          <span className="text-xs font-medium text-slate-300">{condition}%</span>
        </div>
        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${color}`}
            style={{ width: `${condition}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="text-emerald-500" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-slate-100">ImmoTycoon</h1>
                <p className="text-xs text-slate-400">Dein Immobilien-Imperium</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Bargeld */}
              <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2">
                  <Coins className="text-amber-500" size={20} />
                  <div>
                    <p className="text-xs text-slate-400">Bargeld</p>
                    <p className="text-lg font-bold text-slate-100">
                      {cash.toLocaleString('de-DE')} €
                    </p>
                  </div>
                </div>
              </div>

              {/* Cashflow */}
              <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-emerald-500" size={20} />
                  <div>
                    <p className="text-xs text-slate-400">Monatlich</p>
                    <p className="text-lg font-bold text-emerald-400">
                      +{monthlyIncome.toLocaleString('de-DE')} €
                    </p>
                  </div>
                </div>
              </div>

              {/* Zeit */}
              <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2">
                  <Calendar className="text-blue-500" size={20} />
                  <div>
                    <p className="text-xs text-slate-400">Tag / Woche</p>
                    <p className="text-lg font-bold text-slate-100">
                      {day} / {week}
                    </p>
                  </div>
                </div>
              </div>

              {/* Next Month Button */}
              <button
                onClick={nextMonth}
                className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Calendar size={18} />
                Nächster Monat
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Immobilienmarkt */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <ShoppingCart className="text-blue-500" size={24} />
              <h2 className="text-2xl font-bold">Immobilienmarkt</h2>
              <span className="bg-slate-800 px-3 py-1 rounded-full text-sm text-slate-400">
                {marketProperties.length} verfügbar
              </span>
            </div>

            <div className="space-y-4">
              {marketProperties.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
                  <AlertCircle className="mx-auto text-slate-600 mb-3" size={48} />
                  <p className="text-slate-400">Keine Immobilien mehr verfügbar</p>
                  <p className="text-xs text-slate-500 mt-2">Verwalte dein Portfolio!</p>
                </div>
              ) : (
                marketProperties.map(property => (
                  <div
                    key={property.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">{property.name}</h3>
                        <StatusBadge status={property.status} />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-400">
                          {property.purchasePrice.toLocaleString('de-DE')} €
                        </p>
                        <p className="text-xs text-slate-500">Kaufpreis</p>
                      </div>
                    </div>

                    <ConditionBar condition={property.condition} />

                    <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                      <div className="bg-slate-800 p-3 rounded-lg">
                        <p className="text-slate-400 text-xs mb-1">Renovierung</p>
                        <p className="font-semibold">{property.renovationCost.toLocaleString('de-DE')} €</p>
                      </div>
                      <div className="bg-slate-800 p-3 rounded-lg">
                        <p className="text-slate-400 text-xs mb-1">Potenzielle Miete</p>
                        <p className="font-semibold text-emerald-400">{property.potentialRent.toLocaleString('de-DE')} €/M</p>
                      </div>
                    </div>

                    <button
                      onClick={() => buyProperty(property)}
                      disabled={cash < property.purchasePrice}
                      className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {cash < property.purchasePrice ? (
                        <>
                          <AlertCircle size={18} />
                          Nicht genug Geld
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={18} />
                          Kaufen
                        </>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Mein Portfolio */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Home className="text-emerald-500" size={24} />
              <h2 className="text-2xl font-bold">Mein Portfolio</h2>
              <span className="bg-slate-800 px-3 py-1 rounded-full text-sm text-slate-400">
                {portfolio.length} Objekte
              </span>
            </div>

            <div className="space-y-4">
              {portfolio.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
                  <Building2 className="mx-auto text-slate-600 mb-3" size={48} />
                  <p className="text-slate-400">Noch keine Immobilien im Portfolio</p>
                  <p className="text-xs text-slate-500 mt-2">Kaufe deine erste Immobilie!</p>
                </div>
              ) : (
                portfolio.map(property => (
                  <div
                    key={property.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-5"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">{property.name}</h3>
                        <StatusBadge status={property.status} />
                      </div>
                      {property.status === 'rented' && (
                        <div className="text-right">
                          <p className="text-2xl font-bold text-emerald-400">
                            {property.potentialRent.toLocaleString('de-DE')} €
                          </p>
                          <p className="text-xs text-slate-500">Monatlich</p>
                        </div>
                      )}
                    </div>

                    <ConditionBar condition={property.condition} />

                    <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                      <div className="bg-slate-800 p-3 rounded-lg">
                        <p className="text-slate-400 text-xs mb-1">Renovierung nötig</p>
                        <p className="font-semibold">{property.renovationCost.toLocaleString('de-DE')} €</p>
                      </div>
                      <div className="bg-slate-800 p-3 rounded-lg">
                        <p className="text-slate-400 text-xs mb-1">Miete pro Monat</p>
                        <p className="font-semibold text-emerald-400">{property.potentialRent.toLocaleString('de-DE')} €</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      {/* Renovieren Button */}
                      {property.condition < 100 && property.status !== 'rented' && (
                        <button
                          onClick={() => renovateProperty(property.id)}
                          disabled={cash < property.renovationCost || property.status === 'renovating'}
                          className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Hammer size={18} />
                          {property.status === 'renovating' ? 'Wird renoviert...' : 'Renovieren'}
                        </button>
                      )}

                      {/* Vermieten Button */}
                      {property.condition === 100 && property.status !== 'rented' && (
                        <button
                          onClick={() => rentProperty(property.id)}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Users size={18} />
                          Vermieten
                        </button>
                      )}

                      {/* Vermietet Status */}
                      {property.status === 'rented' && (
                        <button
                          disabled
                          className="flex-1 bg-emerald-600/30 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 cursor-default"
                        >
                          <CheckCircle size={18} />
                          Vermietet ✓
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
