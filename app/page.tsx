'use client';

import { useState, useEffect } from 'react';
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
  AlertCircle,
  Trash2,
  ScrollText
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

interface GameEvent {
  id: number;
  message: string;
  type: 'positive' | 'negative' | 'neutral';
  timestamp: number;
}

interface GameState {
  cash: number;
  day: number;
  week: number;
  monthlyIncome: number;
  portfolio: Property[];
  marketProperties: Property[];
  eventLog: GameEvent[];
}

const INITIAL_MARKET_PROPERTIES: Property[] = [
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
];

const EVENTS = [
  { message: '🎉 Marktboom! Alle Mieten steigen um 10%', type: 'positive' as const, effect: 'rent_increase' },
  { message: '📈 Wirtschaftswachstum! +2000 € Bonus', type: 'positive' as const, effect: 'bonus' },
  { message: '⚡ Glückstreffer! Ein Mieter zahlt doppelt', type: 'positive' as const, effect: 'double_rent' },
  { message: '🌧️ Sturmschaden an einer Immobilie! -800 €', type: 'negative' as const, effect: 'storm_damage' },
  { message: '🚫 Mieter ausgezogen (zufälliges Objekt)', type: 'negative' as const, effect: 'tenant_leaves' },
  { message: '💸 Unerwartete Reparaturen! -1200 €', type: 'negative' as const, effect: 'repair_cost' },
  { message: '📉 Rezession! Mieten sinken um 5%', type: 'negative' as const, effect: 'rent_decrease' },
  { message: '🔧 Kostenlose Renovierung von der Stadt', type: 'positive' as const, effect: 'free_renovation' },
  { message: '📊 Stabiler Monat - Keine besonderen Ereignisse', type: 'neutral' as const, effect: 'none' }
];

export default function ImmoTycoon() {
  // Globaler Spiel-Status
  const [cash, setCash] = useState(25000);
  const [day, setDay] = useState(1);
  const [week, setWeek] = useState(1);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [portfolio, setPortfolio] = useState<Property[]>([]);
  const [marketProperties, setMarketProperties] = useState<Property[]>(INITIAL_MARKET_PROPERTIES);
  const [eventLog, setEventLog] = useState<GameEvent[]>([]);
  const [eventCounter, setEventCounter] = useState(1);

  // LocalStorage laden beim Start
  useEffect(() => {
    const savedGame = localStorage.getItem('immoTycoonSave');
    if (savedGame) {
      try {
        const gameState: GameState = JSON.parse(savedGame);
        setCash(gameState.cash);
        setDay(gameState.day);
        setWeek(gameState.week);
        setMonthlyIncome(gameState.monthlyIncome);
        setPortfolio(gameState.portfolio);
        setMarketProperties(gameState.marketProperties);
        setEventLog(gameState.eventLog || []);
        addEventToLog('💾 Spielstand geladen!', 'neutral');
      } catch (error) {
        console.error('Fehler beim Laden:', error);
      }
    }
  }, []);

  // LocalStorage speichern bei jeder Änderung
  useEffect(() => {
    const gameState: GameState = {
      cash,
      day,
      week,
      monthlyIncome,
      portfolio,
      marketProperties,
      eventLog
    };
    localStorage.setItem('immoTycoonSave', JSON.stringify(gameState));
  }, [cash, day, week, monthlyIncome, portfolio, marketProperties, eventLog]);

  // Event zum Log hinzufügen
  const addEventToLog = (message: string, type: 'positive' | 'negative' | 'neutral') => {
    const newEvent: GameEvent = {
      id: eventCounter,
      message,
      type,
      timestamp: Date.now()
    };
    setEventCounter(eventCounter + 1);
    setEventLog(prev => [newEvent, ...prev].slice(0, 5)); // Nur die letzten 5 Events
  };

  // Monatliches Einkommen berechnen
  const calculateMonthlyIncome = () => {
    const rentedProperties = portfolio.filter(p => p.status === 'rented');
    return rentedProperties.reduce((sum, p) => sum + p.potentialRent, 0);
  };

  // Event auslösen
  const triggerRandomEvent = () => {
    // 30% Chance auf ein Event
    if (Math.random() > 0.3) return;

    const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    addEventToLog(event.message, event.type);

    // Event-Effekte anwenden
    switch (event.effect) {
      case 'rent_increase':
        setPortfolio(prev => prev.map(p => ({
          ...p,
          potentialRent: Math.round(p.potentialRent * 1.1)
        })));
        break;
      
      case 'bonus':
        setCash(prev => prev + 2000);
        break;
      
      case 'double_rent':
        const rentedProps = portfolio.filter(p => p.status === 'rented');
        if (rentedProps.length > 0) {
          const doubleRent = rentedProps.reduce((sum, p) => sum + p.potentialRent, 0);
          setCash(prev => prev + doubleRent);
        }
        break;
      
      case 'storm_damage':
        setCash(prev => Math.max(0, prev - 800));
        break;
      
      case 'tenant_leaves':
        const rentedProperties = portfolio.filter(p => p.status === 'rented');
        if (rentedProperties.length > 0) {
          const randomProp = rentedProperties[Math.floor(Math.random() * rentedProperties.length)];
          setPortfolio(prev => prev.map(p => 
            p.id === randomProp.id ? { ...p, status: 'owned' as PropertyStatus } : p
          ));
        }
        break;
      
      case 'repair_cost':
        setCash(prev => Math.max(0, prev - 1200));
        break;
      
      case 'rent_decrease':
        setPortfolio(prev => prev.map(p => ({
          ...p,
          potentialRent: Math.round(p.potentialRent * 0.95)
        })));
        break;
      
      case 'free_renovation':
        const ownedProps = portfolio.filter(p => p.condition < 100 && p.status === 'owned');
        if (ownedProps.length > 0) {
          const randomProp = ownedProps[Math.floor(Math.random() * ownedProps.length)];
          setPortfolio(prev => prev.map(p => 
            p.id === randomProp.id ? { ...p, condition: 100 } : p
          ));
        }
        break;
    }
  };

  // Spielstand zurücksetzen
  const resetGame = () => {
    if (confirm('Möchtest du wirklich neu starten? Der aktuelle Spielstand geht verloren!')) {
      localStorage.removeItem('immoTycoonSave');
      setCash(25000);
      setDay(1);
      setWeek(1);
      setMonthlyIncome(0);
      setPortfolio([]);
      setMarketProperties(INITIAL_MARKET_PROPERTIES);
      setEventLog([]);
      addEventToLog('🎮 Neues Spiel gestartet!', 'neutral');
    }
  };

  // Kaufen-Funktion
  const buyProperty = (property: Property) => {
    if (cash >= property.purchasePrice) {
      setCash(cash - property.purchasePrice);
      setPortfolio([...portfolio, { ...property, status: 'owned' }]);
      setMarketProperties(marketProperties.filter(p => p.id !== property.id));
      addEventToLog(`🏠 ${property.name} gekauft für ${property.purchasePrice.toLocaleString('de-DE')} €`, 'positive');
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

      addEventToLog(`🔨 ${property.name} wird renoviert (+25%)`, 'neutral');

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

    addEventToLog(`👥 ${property.name} erfolgreich vermietet (+${property.potentialRent} €/Monat)`, 'positive');
  };

  // Zeit voranschreiten
  const nextMonth = () => {
    // Mieteinnahmen gutschreiben
    const totalRent = calculateMonthlyIncome();
    setCash(cash + totalRent);

    // Zeit aktualisieren
    setDay(day + 30);
    setWeek(week + 4);

    // Event auslösen (30% Chance)
    triggerRandomEvent();

    if (totalRent > 0) {
      addEventToLog(`💰 Mieteinnahmen: +${totalRent.toLocaleString('de-DE')} €`, 'positive');
    }
  };

  // Monatliches Einkommen aktualisieren
  useEffect(() => {
    setMonthlyIncome(calculateMonthlyIncome());
  }, [portfolio]);

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
      <span className={`inline-flex items-center gap-1 lg:gap-1.5 px-2 py-0.5 lg:px-3 lg:py-1 rounded-full text-[10px] lg:text-xs font-medium ${config.color}`}>
        <Icon size={12} className="flex-shrink-0" />
        <span className="truncate">{config.text}</span>
      </span>
    );
  };

  // Fortschrittsbalken Komponente
  const ConditionBar = ({ condition }: { condition: number }) => {
    const color = condition >= 100 ? 'bg-emerald-500' : condition >= 50 ? 'bg-amber-500' : 'bg-red-500';
    
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-1 lg:mb-1.5">
          <span className="text-[10px] lg:text-xs text-slate-400">Zustand</span>
          <span className="text-[10px] lg:text-xs font-medium text-slate-300">{condition}%</span>
        </div>
        <div className="w-full h-1.5 lg:h-2 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${color}`}
            style={{ width: `${condition}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 w-full overflow-x-hidden">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="w-full max-w-7xl mx-auto px-4 py-4">
          {/* Logo und Titel */}
          <div className="flex items-center justify-between mb-4 lg:mb-0">
            <div className="flex items-center gap-2">
              <Building2 className="text-emerald-500" size={28} />
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-slate-100">ImmoTycoon</h1>
                <p className="text-xs text-slate-400 hidden sm:block">Dein Immobilien-Imperium</p>
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={resetGame}
              className="bg-red-600 hover:bg-red-700 p-2 rounded-lg transition-colors"
              title="Spiel zurücksetzen"
            >
              <Trash2 size={18} />
            </button>
          </div>
          
          {/* Stats Grid - 2x2 auf Mobile, horizontal auf Desktop */}
          <div className="grid grid-cols-2 lg:flex lg:items-center gap-2 lg:gap-4">
            {/* Bargeld */}
            <div className="bg-slate-800 px-3 py-2 rounded-lg border border-slate-700">
              <div className="flex items-center gap-1.5">
                <Coins className="text-amber-500" size={16} />
                <div>
                  <p className="text-[10px] lg:text-xs text-slate-400">Bargeld</p>
                  <p className="text-sm lg:text-lg font-bold text-slate-100">
                    {cash.toLocaleString('de-DE')} €
                  </p>
                </div>
              </div>
            </div>

            {/* Cashflow */}
            <div className="bg-slate-800 px-3 py-2 rounded-lg border border-slate-700">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="text-emerald-500" size={16} />
                <div>
                  <p className="text-[10px] lg:text-xs text-slate-400">Monatlich</p>
                  <p className="text-sm lg:text-lg font-bold text-emerald-400">
                    +{monthlyIncome.toLocaleString('de-DE')} €
                  </p>
                </div>
              </div>
            </div>

            {/* Zeit */}
            <div className="bg-slate-800 px-3 py-2 rounded-lg border border-slate-700">
              <div className="flex items-center gap-1.5">
                <Calendar className="text-blue-500" size={16} />
                <div>
                  <p className="text-[10px] lg:text-xs text-slate-400">Tag / Woche</p>
                  <p className="text-sm lg:text-lg font-bold text-slate-100">
                    {day} / {week}
                  </p>
                </div>
              </div>
            </div>

            {/* Next Month Button */}
            <button
              onClick={nextMonth}
              className="bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-lg text-sm lg:text-base font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Calendar size={16} />
              <span className="hidden sm:inline">Nächster Monat</span>
              <span className="sm:hidden">Weiter</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full max-w-7xl mx-auto px-4 py-6 lg:py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-6">
          {/* Immobilienmarkt */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6">
              <ShoppingCart className="text-blue-500" size={20} />
              <h2 className="text-xl lg:text-2xl font-bold">Immobilienmarkt</h2>
              <span className="bg-slate-800 px-2 py-0.5 lg:px-3 lg:py-1 rounded-full text-xs lg:text-sm text-slate-400">
                {marketProperties.length} verfügbar
              </span>
            </div>

            <div className="space-y-4">
              {marketProperties.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:p-8 text-center">
                  <AlertCircle className="mx-auto text-slate-600 mb-3" size={40} />
                  <p className="text-slate-400 text-sm lg:text-base">Keine Immobilien mehr verfügbar</p>
                  <p className="text-xs text-slate-500 mt-2">Verwalte dein Portfolio!</p>
                </div>
              ) : (
                marketProperties.map(property => (
                  <div
                    key={property.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 lg:p-5 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3 lg:mb-4 gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base lg:text-lg font-semibold mb-1 truncate">{property.name}</h3>
                        <StatusBadge status={property.status} />
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg lg:text-2xl font-bold text-emerald-400">
                          {property.purchasePrice.toLocaleString('de-DE')} €
                        </p>
                        <p className="text-[10px] lg:text-xs text-slate-500">Kaufpreis</p>
                      </div>
                    </div>

                    <ConditionBar condition={property.condition} />

                    <div className="grid grid-cols-2 gap-2 lg:gap-3 mt-3 lg:mt-4 text-sm">
                      <div className="bg-slate-800 p-2 lg:p-3 rounded-lg">
                        <p className="text-slate-400 text-[10px] lg:text-xs mb-1">Renovierung</p>
                        <p className="font-semibold text-xs lg:text-sm">{property.renovationCost.toLocaleString('de-DE')} €</p>
                      </div>
                      <div className="bg-slate-800 p-2 lg:p-3 rounded-lg">
                        <p className="text-slate-400 text-[10px] lg:text-xs mb-1">Potenzielle Miete</p>
                        <p className="font-semibold text-emerald-400 text-xs lg:text-sm">{property.potentialRent.toLocaleString('de-DE')} €/M</p>
                      </div>
                    </div>

                    <button
                      onClick={() => buyProperty(property)}
                      disabled={cash < property.purchasePrice}
                      className="w-full mt-3 lg:mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed px-4 py-2.5 lg:py-3 rounded-lg text-sm lg:text-base font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {cash < property.purchasePrice ? (
                        <>
                          <AlertCircle size={16} />
                          Nicht genug Geld
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={16} />
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
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6">
              <Home className="text-emerald-500" size={20} />
              <h2 className="text-xl lg:text-2xl font-bold">Mein Portfolio</h2>
              <span className="bg-slate-800 px-2 py-0.5 lg:px-3 lg:py-1 rounded-full text-xs lg:text-sm text-slate-400">
                {portfolio.length} Objekte
              </span>
            </div>

            <div className="space-y-4">
              {portfolio.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:p-8 text-center">
                  <Building2 className="mx-auto text-slate-600 mb-3" size={40} />
                  <p className="text-slate-400 text-sm lg:text-base">Noch keine Immobilien im Portfolio</p>
                  <p className="text-xs text-slate-500 mt-2">Kaufe deine erste Immobilie!</p>
                </div>
              ) : (
                portfolio.map(property => (
                  <div
                    key={property.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 lg:p-5"
                  >
                    <div className="flex items-start justify-between mb-3 lg:mb-4 gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base lg:text-lg font-semibold mb-1 truncate">{property.name}</h3>
                        <StatusBadge status={property.status} />
                      </div>
                      {property.status === 'rented' && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg lg:text-2xl font-bold text-emerald-400">
                            {property.potentialRent.toLocaleString('de-DE')} €
                          </p>
                          <p className="text-[10px] lg:text-xs text-slate-500">Monatlich</p>
                        </div>
                      )}
                    </div>

                    <ConditionBar condition={property.condition} />

                    <div className="grid grid-cols-2 gap-2 lg:gap-3 mt-3 lg:mt-4 text-sm">
                      <div className="bg-slate-800 p-2 lg:p-3 rounded-lg">
                        <p className="text-slate-400 text-[10px] lg:text-xs mb-1">Renovierung nötig</p>
                        <p className="font-semibold text-xs lg:text-sm">{property.renovationCost.toLocaleString('de-DE')} €</p>
                      </div>
                      <div className="bg-slate-800 p-2 lg:p-3 rounded-lg">
                        <p className="text-slate-400 text-[10px] lg:text-xs mb-1">Miete pro Monat</p>
                        <p className="font-semibold text-emerald-400 text-xs lg:text-sm">{property.potentialRent.toLocaleString('de-DE')} €</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3 lg:mt-4">
                      {/* Renovieren Button */}
                      {property.condition < 100 && property.status !== 'rented' && (
                        <button
                          onClick={() => renovateProperty(property.id)}
                          disabled={cash < property.renovationCost || property.status === 'renovating'}
                          className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg text-sm lg:text-base font-medium transition-colors flex items-center justify-center gap-1.5 lg:gap-2"
                        >
                          <Hammer size={16} />
                          <span className="truncate">{property.status === 'renovating' ? 'Wird renoviert...' : 'Renovieren'}</span>
                        </button>
                      )}

                      {/* Vermieten Button */}
                      {property.condition === 100 && property.status !== 'rented' && (
                        <button
                          onClick={() => rentProperty(property.id)}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg text-sm lg:text-base font-medium transition-colors flex items-center justify-center gap-1.5 lg:gap-2"
                        >
                          <Users size={16} />
                          Vermieten
                        </button>
                      )}

                      {/* Vermietet Status */}
                      {property.status === 'rented' && (
                        <button
                          disabled
                          className="flex-1 bg-emerald-600/30 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg text-sm lg:text-base font-medium flex items-center justify-center gap-1.5 lg:gap-2 cursor-default"
                        >
                          <CheckCircle size={16} />
                          Vermietet ✓
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Event Log */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6">
              <ScrollText className="text-purple-500" size={20} />
              <h2 className="text-xl lg:text-2xl font-bold">Ereignisse</h2>
              <span className="bg-slate-800 px-2 py-0.5 lg:px-3 lg:py-1 rounded-full text-xs lg:text-sm text-slate-400">
                {eventLog.length}
              </span>
            </div>

            <div className="space-y-3">
              {eventLog.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:p-8 text-center">
                  <ScrollText className="mx-auto text-slate-600 mb-3" size={40} />
                  <p className="text-slate-400 text-sm lg:text-base">Noch keine Ereignisse</p>
                  <p className="text-xs text-slate-500 mt-2">Spiele, um Events zu erleben!</p>
                </div>
              ) : (
                eventLog.map(event => (
                  <div
                    key={event.id}
                    className={`bg-slate-900 border rounded-xl p-3 lg:p-4 ${
                      event.type === 'positive' 
                        ? 'border-emerald-500/30 bg-emerald-500/5' 
                        : event.type === 'negative'
                        ? 'border-red-500/30 bg-red-500/5'
                        : 'border-slate-800'
                    }`}
                  >
                    <p className="text-xs lg:text-sm text-slate-300">{event.message}</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {new Date(event.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <AlertCircle size={16} className="text-blue-400" />
                Spiel-Info
              </h3>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• Kaufe heruntergekommene Immobilien</li>
                <li>• Renoviere sie auf 100% Zustand</li>
                <li>• Vermiete sie für passives Einkommen</li>
                <li>• 30% Chance auf Events pro Monat</li>
                <li>• Spielstand wird automatisch gespeichert</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
