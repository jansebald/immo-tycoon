'use client';

import { useState, useEffect, useRef } from 'react';
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
  ScrollText,
  Store,
  Zap,
  Megaphone,
  HardHat,
  Shield,
  DollarSign,
  X,
  User,
  Star,
  Landmark,
  TrendingDown,
  PiggyBank
} from 'lucide-react';

// Typen
type PropertyStatus = 'for_sale' | 'owned' | 'renovating' | 'rented';
type TabType = 'properties' | 'shop' | 'finance';
type IconType = React.ComponentType<{ size?: number; className?: string }>;

interface Property {
  id: number;
  name: string;
  purchasePrice: number;
  condition: number; // 0-100%
  renovationCost: number;
  potentialRent: number;
  status: PropertyStatus;
  imageUrl: string;
  totalInvested?: number; // Wie viel wurde insgesamt investiert
  tenant?: Tenant | null;
}

interface Tenant {
  id: string;
  name: string;
  type: 'student' | 'family' | 'startup' | 'senior' | 'professional';
  rentOffer: number; // Prozent von potentialRent (80-120%)
  riskLevel: number; // 1-10 (höher = riskanter)
  minCondition: number; // Mindest-Zustand
}

interface GameEvent {
  id: number;
  message: string;
  type: 'positive' | 'negative' | 'neutral';
  timestamp: number;
}

interface Upgrade {
  id: string;
  name: string;
  description: string;
  price: number;
  iconName: string;
  purchased: boolean;
  effect: string;
}

interface GameState {
  cash: number;
  day: number;
  week: number;
  monthlyIncome: number;
  portfolio: Property[];
  marketProperties: Property[];
  eventLog: GameEvent[];
  upgrades: Upgrade[];
  eventCounter: number;
  nextPropertyId?: number;
  debt?: number; // Schulden/Kredite
}

const INITIAL_MARKET_PROPERTIES: Property[] = [
  {
    id: 1,
    name: '🚗 Winzige Garage',
    purchasePrice: 8000,
    condition: 30,
    renovationCost: 2000,
    potentialRent: 250,
    status: 'for_sale',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=200&fit=crop&auto=format&q=80',
    totalInvested: 0
  },
  {
    id: 2,
    name: '🏚️ Verschimmeltes Apartment',
    purchasePrice: 15000,
    condition: 20,
    renovationCost: 5000,
    potentialRent: 650,
    status: 'for_sale',
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=200&fit=crop&auto=format&q=80',
    totalInvested: 0
  },
  {
    id: 3,
    name: '🏠 Altes Reihenhaus',
    purchasePrice: 22000,
    condition: 40,
    renovationCost: 8000,
    potentialRent: 1200,
    status: 'for_sale',
    imageUrl: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&h=200&fit=crop&auto=format&q=80',
    totalInvested: 0
  },
  {
    id: 4,
    name: '🏢 Heruntergekommenes Loft',
    purchasePrice: 35000,
    condition: 25,
    renovationCost: 12000,
    potentialRent: 1800,
    status: 'for_sale',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=200&fit=crop&auto=format&q=80',
    totalInvested: 0
  }
];

const INITIAL_UPGRADES: Upgrade[] = [
  {
    id: 'cheap_labor',
    name: 'Billige Arbeitskräfte',
    description: 'Renovierungskosten sinken um 20%',
    price: 2500,
    iconName: 'Hammer',
    purchased: false,
    effect: 'renovation_discount'
  },
  {
    id: 'marketing',
    name: 'Aggressives Marketing',
    description: 'Mieteinnahmen steigen um 10%',
    price: 5000,
    iconName: 'Megaphone',
    purchased: false,
    effect: 'rent_boost'
  },
  {
    id: 'construction_manager',
    name: 'Bauleiter',
    description: 'Automatische Renovierung jeden Monat',
    price: 15000,
    iconName: 'HardHat',
    purchased: false,
    effect: 'auto_renovation'
  },
  {
    id: 'insurance',
    name: 'Versicherung',
    description: 'Schützt vor negativen Events',
    price: 8000,
    iconName: 'Shield',
    purchased: false,
    effect: 'block_negative_events'
  }
];

const TENANT_TYPES = [
  { type: 'student' as const, name: 'Student', rentRange: [70, 85], riskRange: [6, 9], minCondition: 60 },
  { type: 'family' as const, name: 'Familie', rentRange: [95, 105], riskRange: [3, 5], minCondition: 85 },
  { type: 'startup' as const, name: 'Start-up', rentRange: [110, 130], riskRange: [7, 10], minCondition: 75 },
  { type: 'senior' as const, name: 'Senior', rentRange: [80, 95], riskRange: [2, 4], minCondition: 80 },
  { type: 'professional' as const, name: 'Berufstätig', rentRange: [100, 115], riskRange: [2, 5], minCondition: 90 }
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
  // UI State
  const [activeTab, setActiveTab] = useState<TabType>('properties');
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [tenantCandidates, setTenantCandidates] = useState<Tenant[]>([]);

  // Globaler Spiel-Status
  const [cash, setCash] = useState(25000);
  const [day, setDay] = useState(1);
  const [week, setWeek] = useState(1);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [portfolio, setPortfolio] = useState<Property[]>([]);
  const [marketProperties, setMarketProperties] = useState<Property[]>(INITIAL_MARKET_PROPERTIES);
  const [eventLog, setEventLog] = useState<GameEvent[]>([]);
  const eventCounterRef = useRef(1); // Ref statt State für sofortige Aktualisierung
  const [upgrades, setUpgrades] = useState<Upgrade[]>(INITIAL_UPGRADES);
  const [nextPropertyId, setNextPropertyId] = useState(100); // Für eindeutige IDs
  const [debt, setDebt] = useState(0); // Schulden

  // Icon-Mapping Funktion
  const getIconComponent = (iconName: string): IconType => {
    const iconMap: Record<string, IconType> = {
      'Hammer': Hammer,
      'Megaphone': Megaphone,
      'HardHat': HardHat,
      'Shield': Shield
    };
    return iconMap[iconName] || Hammer;
  };

  // Fix für Properties ohne imageUrl
  const ensureImageUrl = (property: Property): Property => {
    if (!property.imageUrl || property.imageUrl.trim() === '') {
      // Fallback-Bild basierend auf Namen
      const fallbackImages: Record<string, string> = {
        'Garage': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=200&fit=crop&auto=format&q=80',
        'Apartment': 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=200&fit=crop&auto=format&q=80',
        'Reihenhaus': 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&h=200&fit=crop&auto=format&q=80',
        'Loft': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=200&fit=crop&auto=format&q=80'
      };
      
      for (const [key, url] of Object.entries(fallbackImages)) {
        if (property.name.includes(key)) {
          return { ...property, imageUrl: url };
        }
      }
      
      // Standard-Fallback
      return { ...property, imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=200&fit=crop&auto=format&q=80' };
    }
    return property;
  };

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
        
        // Properties mit imageUrl-Fix laden
        setPortfolio(gameState.portfolio.map(ensureImageUrl));
        setMarketProperties(gameState.marketProperties.map(ensureImageUrl));
        
        // EventCounter richtig setzen (gespeicherten Wert bevorzugen)
        let nextCounter = 1;
        if (gameState.eventCounter) {
          // Bevorzuge den gespeicherten Counter-Wert
          nextCounter = gameState.eventCounter;
        } else if (gameState.eventLog && gameState.eventLog.length > 0) {
          // Fallback: Berechne aus dem Event Log
          const maxId = Math.max(...gameState.eventLog.map(e => e.id));
          nextCounter = maxId + 1;
        }
        
        // Property ID Counter laden
        if (gameState.nextPropertyId) {
          setNextPropertyId(gameState.nextPropertyId);
        }
        
        // Event Log laden (OHNE "Geladen"-Nachricht, um Duplikate zu vermeiden)
        setEventLog(gameState.eventLog || []);
        eventCounterRef.current = nextCounter; // Ref statt State
        
        setUpgrades(gameState.upgrades || INITIAL_UPGRADES);
        setDebt(gameState.debt || 0);
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
      eventLog,
      upgrades,
      eventCounter: eventCounterRef.current, // Ref-Wert speichern
      nextPropertyId,
      debt
    };
    localStorage.setItem('immoTycoonSave', JSON.stringify(gameState));
  }, [cash, day, week, monthlyIncome, portfolio, marketProperties, eventLog, upgrades, nextPropertyId, debt]);

  // Hilfsfunktion: Prüfe ob Upgrade gekauft wurde
  const hasUpgrade = (upgradeId: string) => {
    return upgrades.find(u => u.id === upgradeId)?.purchased || false;
  };

  // Event zum Log hinzufügen
  const addEventToLog = (message: string, type: 'positive' | 'negative' | 'neutral') => {
    const newEvent: GameEvent = {
      id: eventCounterRef.current,
      message,
      type,
      timestamp: Date.now()
    };
    eventCounterRef.current = eventCounterRef.current + 1; // Sofort erhöhen
    setEventLog(prev => [newEvent, ...prev].slice(0, 5));
  };

  // Generiere zufällige Mieter-Bewerber
  const generateTenantCandidates = (property: Property): Tenant[] => {
    const candidates: Tenant[] = [];
    const shuffled = [...TENANT_TYPES].sort(() => Math.random() - 0.5).slice(0, 3);
    
    shuffled.forEach((template, index) => {
      const rentOffer = Math.floor(Math.random() * (template.rentRange[1] - template.rentRange[0]) + template.rentRange[0]);
      const riskLevel = Math.floor(Math.random() * (template.riskRange[1] - template.riskRange[0]) + template.riskRange[0]);
      
      candidates.push({
        id: `${property.id}-tenant-${index}`,
        name: `${template.name} ${String.fromCharCode(65 + index)}`,
        type: template.type,
        rentOffer,
        riskLevel,
        minCondition: template.minCondition
      });
    });
    
    return candidates;
  };

  // Monatliches Einkommen berechnen (mit Marketing-Boost)
  const calculateMonthlyIncome = () => {
    const rentedProperties = portfolio.filter(p => p.status === 'rented' && p.tenant);
    let total = rentedProperties.reduce((sum, p) => {
      const baseRent = p.potentialRent;
      const tenantModifier = p.tenant ? (p.tenant.rentOffer / 100) : 1;
      return sum + Math.round(baseRent * tenantModifier);
    }, 0);
    
    // Marketing Upgrade: +10% Miete
    if (hasUpgrade('marketing')) {
      total = Math.round(total * 1.1);
    }
    
    return total;
  };

  // Renovierungskosten berechnen (mit Rabatt)
  const getRenovationCost = (baseCost: number) => {
    if (hasUpgrade('cheap_labor')) {
      return Math.round(baseCost * 0.8);
    }
    return baseCost;
  };

  // Marktwert berechnen
  const calculateMarketValue = (property: Property): number => {
    const invested = property.totalInvested || 0;
    const marketFactor = 1 + (Math.random() * 0.2 + 0.1); // 10-30% Gewinn
    return Math.round((property.purchasePrice + invested) * marketFactor);
  };

  // Event auslösen
  const triggerRandomEvent = () => {
    if (Math.random() > 0.3) return;

    let availableEvents = EVENTS;
    if (hasUpgrade('insurance')) {
      availableEvents = EVENTS.filter(e => e.type !== 'negative');
    }

    const event = availableEvents[Math.floor(Math.random() * availableEvents.length)];
    addEventToLog(event.message, event.type);

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
          const doubleRent = calculateMonthlyIncome();
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
            p.id === randomProp.id ? { ...p, status: 'owned' as PropertyStatus, tenant: null } : p
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

  // Auto-Renovierung durch Bauleiter
  const autoRenovate = () => {
    if (!hasUpgrade('construction_manager')) return;

    const needsRenovation = portfolio.filter(p => p.condition < 100 && p.status !== 'rented');
    if (needsRenovation.length > 0) {
      const property = needsRenovation[0];
      setPortfolio(prev => prev.map(p => 
        p.id === property.id 
          ? { ...p, condition: Math.min(100, p.condition + 30) } 
          : p
      ));
      addEventToLog(`🏗️ Bauleiter hat ${property.name} renoviert (+30%)`, 'positive');
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
      setUpgrades(INITIAL_UPGRADES);
      setNextPropertyId(100);
      setDebt(0);
      eventCounterRef.current = 1; // Ref zurücksetzen
      addEventToLog('🎮 Neues Spiel gestartet!', 'neutral');
    }
  };

  // Kaufen-Funktion
  const buyProperty = (property: Property) => {
    if (cash >= property.purchasePrice) {
      setCash(cash - property.purchasePrice);
      setPortfolio([...portfolio, { 
        ...property, 
        status: 'owned',
        totalInvested: property.purchasePrice
      }]);
      setMarketProperties(marketProperties.filter(p => p.id !== property.id));
      addEventToLog(`🏠 ${property.name} gekauft für ${property.purchasePrice.toLocaleString('de-DE')} €`, 'positive');
    }
  };

  // Renovieren-Funktion
  const renovateProperty = (propertyId: number) => {
    const property = portfolio.find(p => p.id === propertyId);
    if (!property) return;

    const actualCost = getRenovationCost(property.renovationCost);
    if (cash < actualCost) return;

    if (property.condition < 100) {
      setCash(cash - actualCost);
      setPortfolio(portfolio.map(p => 
        p.id === propertyId 
          ? { 
              ...p, 
              condition: Math.min(100, p.condition + 25), 
              status: 'renovating' as PropertyStatus,
              totalInvested: (p.totalInvested || 0) + actualCost
            }
          : p
      ));

      addEventToLog(`🔨 ${property.name} wird renoviert (+25%)`, 'neutral');

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

  // Mieter-Auswahl öffnen
  const openTenantSelection = (property: Property) => {
    if (property.condition < 100) return;
    
    const candidates = generateTenantCandidates(property);
    setTenantCandidates(candidates);
    setSelectedProperty(property);
    setShowTenantModal(true);
  };

  // Mieter auswählen
  const selectTenant = (tenant: Tenant) => {
    if (!selectedProperty) return;

    if (selectedProperty.condition < tenant.minCondition) {
      addEventToLog(`❌ ${tenant.name} lehnt ab - Zustand zu niedrig!`, 'negative');
      return;
    }

    setPortfolio(portfolio.map(p => 
      p.id === selectedProperty.id 
        ? { ...p, status: 'rented' as PropertyStatus, tenant }
        : p
    ));

    const actualRent = Math.round(selectedProperty.potentialRent * (tenant.rentOffer / 100));
    addEventToLog(`👥 ${tenant.name} eingezogen! ${actualRent} €/Monat`, 'positive');
    setShowTenantModal(false);
    setSelectedProperty(null);
  };

  // Immobilie verkaufen
  const sellProperty = (propertyId: number) => {
    const property = portfolio.find(p => p.id === propertyId);
    if (!property) return;

    const salePrice = calculateMarketValue(property);
    
    if (confirm(`${property.name} für ${salePrice.toLocaleString('de-DE')} € verkaufen?`)) {
      setCash(cash + salePrice);
      setPortfolio(portfolio.filter(p => p.id !== propertyId));
      
      // Immobilie zurück zum Markt (mit NEUER eindeutiger ID)
      const newProperty: Property = {
        ...property,
        id: nextPropertyId, // NEUE eindeutige ID
        status: 'for_sale' as PropertyStatus,
        condition: Math.max(30, property.condition - 20),
        purchasePrice: Math.round(salePrice * 0.85),
        tenant: null,
        totalInvested: 0
      };
      
      setMarketProperties([...marketProperties, newProperty]);
      setNextPropertyId(nextPropertyId + 1);
      
      addEventToLog(`💰 ${property.name} verkauft für ${salePrice.toLocaleString('de-DE')} €!`, 'positive');
    }
  };

  // Upgrade kaufen
  const buyUpgrade = (upgradeId: string) => {
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade || upgrade.purchased || cash < upgrade.price) return;

    setCash(cash - upgrade.price);
    setUpgrades(upgrades.map(u => 
      u.id === upgradeId ? { ...u, purchased: true } : u
    ));
    addEventToLog(`✨ Upgrade gekauft: ${upgrade.name}`, 'positive');
  };

  // Kredit aufnehmen
  const takeOutLoan = (amount: number = 5000) => {
    setDebt(debt + amount);
    setCash(cash + amount);
    addEventToLog(`🏦 Kredit aufgenommen: +${amount.toLocaleString('de-DE')} €`, 'neutral');
  };

  // Kredit zurückzahlen
  const repayLoan = (amount: number = 5000) => {
    const actualAmount = Math.min(amount, debt, cash);
    if (actualAmount <= 0) return;
    
    setDebt(debt - actualAmount);
    setCash(cash - actualAmount);
    addEventToLog(`💰 Kredit zurückgezahlt: -${actualAmount.toLocaleString('de-DE')} €`, 'positive');
  };

  // Monatliche Zinsen berechnen (5% pro Monat)
  const calculateInterest = () => {
    return Math.round(debt * 0.05);
  };

  // Immobilienvermögen berechnen
  const calculatePropertyValue = () => {
    return portfolio.reduce((sum, p) => sum + calculateMarketValue(p), 0);
  };

  // Nettovermögen berechnen
  const calculateNetWorth = () => {
    return cash + calculatePropertyValue() - debt;
  };

  // Verschuldungsgrad berechnen (0-100%)
  const calculateLeverageRatio = () => {
    const propertyValue = calculatePropertyValue();
    if (propertyValue === 0) return 0;
    return Math.min(100, Math.round((debt / propertyValue) * 100));
  };

  // Zeit voranschreiten
  const nextMonth = () => {
    autoRenovate();
    const totalRent = calculateMonthlyIncome();
    
    // Zinsen berechnen und abziehen
    const interest = calculateInterest();
    const netCashflow = totalRent - interest;
    
    setCash(cash + netCashflow);
    setDay(day + 30);
    setWeek(week + 4);
    triggerRandomEvent();

    // Cashflow-Nachricht
    if (totalRent > 0 || interest > 0) {
      let message = '';
      if (totalRent > 0) message += `💰 Miete: +${totalRent.toLocaleString('de-DE')} €`;
      if (interest > 0) {
        if (message) message += ' | ';
        message += `📉 Zinsen: -${interest.toLocaleString('de-DE')} €`;
      }
      addEventToLog(message, netCashflow >= 0 ? 'positive' : 'negative');
    }

    // Game Over Check (nach 1 Frame delay damit UI aktualisiert wird)
    setTimeout(() => {
      if (cash + netCashflow < -5000) {
        alert('⚠️ BANKROTT! Du hast mehr als 5.000 € Schulden und kein Bargeld mehr. Das Spiel ist vorbei!');
        resetGame();
      }
    }, 100);
  };

  // Monatliches Einkommen aktualisieren
  useEffect(() => {
    setMonthlyIncome(calculateMonthlyIncome());
  }, [portfolio, upgrades]);

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

  // Property Card Komponente
  const PropertyCard = ({ property, isMarket }: { property: Property; isMarket: boolean }) => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors">
      {/* Property Image */}
      <div className="relative w-full h-32 lg:h-40 overflow-hidden bg-slate-800">
        {property.imageUrl && property.imageUrl.trim() !== '' ? (
          <img 
            src={property.imageUrl} 
            alt={property.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <Building2 size={48} />
          </div>
        )}
        <div className="absolute top-2 right-2 z-10">
          <StatusBadge status={property.status} />
        </div>
      </div>

      {/* Property Info */}
      <div className="p-4 lg:p-5">
        <div className="flex items-start justify-between mb-3 gap-2">
          <h3 className="text-base lg:text-lg font-semibold truncate flex-1">{property.name}</h3>
          <div className="text-right flex-shrink-0">
            <p className="text-lg lg:text-xl font-bold text-emerald-400">
              {isMarket ? property.purchasePrice.toLocaleString('de-DE') : calculateMarketValue(property).toLocaleString('de-DE')} €
            </p>
            <p className="text-[10px] lg:text-xs text-slate-500">{isMarket ? 'Kaufpreis' : 'Marktwert'}</p>
          </div>
        </div>

        {property.tenant && (
          <div className="mb-3 p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <p className="text-xs text-purple-400 flex items-center gap-1">
              <User size={12} />
              Mieter: {property.tenant.name}
            </p>
          </div>
        )}

        <ConditionBar condition={property.condition} />

        <div className="grid grid-cols-2 gap-2 lg:gap-3 mt-3 text-sm">
          <div className="bg-slate-800 p-2 lg:p-3 rounded-lg">
            <p className="text-slate-400 text-[10px] lg:text-xs mb-1">Renovierung</p>
            <p className="font-semibold text-xs lg:text-sm">{getRenovationCost(property.renovationCost).toLocaleString('de-DE')} €</p>
          </div>
          <div className="bg-slate-800 p-2 lg:p-3 rounded-lg">
            <p className="text-slate-400 text-[10px] lg:text-xs mb-1">Miete/Monat</p>
            <p className="font-semibold text-emerald-400 text-xs lg:text-sm">
              {property.tenant 
                ? Math.round(property.potentialRent * (property.tenant.rentOffer / 100)).toLocaleString('de-DE')
                : property.potentialRent.toLocaleString('de-DE')
              } €
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 mt-3 lg:mt-4">
          {isMarket ? (
            <button
              onClick={() => buyProperty(property)}
              disabled={cash < property.purchasePrice}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed px-4 py-2.5 rounded-lg text-sm lg:text-base font-medium transition-colors flex items-center justify-center gap-2"
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
          ) : (
            <>
              <div className="flex gap-2">
                {property.condition < 100 && property.status !== 'rented' && (
                  <button
                    onClick={() => renovateProperty(property.id)}
                    disabled={cash < getRenovationCost(property.renovationCost) || property.status === 'renovating'}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Hammer size={16} />
                    <span className="truncate">{property.status === 'renovating' ? 'Wird renoviert...' : 'Renovieren'}</span>
                  </button>
                )}

                {property.condition === 100 && property.status !== 'rented' && (
                  <button
                    onClick={() => openTenantSelection(property)}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Users size={16} />
                    Vermieten
                  </button>
                )}

                {property.status === 'rented' && (
                  <button
                    disabled
                    className="flex-1 bg-emerald-600/30 px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 cursor-default"
                  >
                    <CheckCircle size={16} />
                    Vermietet ✓
                  </button>
                )}
              </div>

              {property.status !== 'rented' && (
                <button
                  onClick={() => sellProperty(property.id)}
                  className="w-full bg-slate-700 hover:bg-slate-600 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <DollarSign size={16} />
                  Verkaufen ({calculateMarketValue(property).toLocaleString('de-DE')} €)
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Mieter-Auswahl Modal
  const TenantModal = () => {
    if (!showTenantModal || !selectedProperty) return null;

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 lg:p-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold">Mieter auswählen</h2>
              <p className="text-sm text-slate-400 mt-1">{selectedProperty.name}</p>
            </div>
            <button
              onClick={() => setShowTenantModal(false)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Tenant Candidates */}
          <div className="p-4 lg:p-6 space-y-4">
            {tenantCandidates.map((tenant) => {
              const canAfford = selectedProperty.condition >= tenant.minCondition;
              const actualRent = Math.round(selectedProperty.potentialRent * (tenant.rentOffer / 100));
              
              return (
                <div
                  key={tenant.id}
                  className={`border rounded-xl p-4 lg:p-5 transition-colors ${
                    canAfford 
                      ? 'border-slate-700 hover:border-emerald-500/50 bg-slate-800/50' 
                      : 'border-red-500/30 bg-red-500/5'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-slate-700 rounded-lg">
                        <User size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{tenant.name}</h3>
                        <p className="text-sm text-slate-400 capitalize">{tenant.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-emerald-400">{actualRent} €</p>
                      <p className="text-xs text-slate-500">{tenant.rentOffer}% vom Basis</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-900 p-3 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Risiko-Level</p>
                      <div className="flex items-center gap-1">
                        {[...Array(10)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-2 w-2 rounded-full ${
                              i < tenant.riskLevel ? 'bg-red-500' : 'bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Min. Zustand</p>
                      <p className="text-lg font-bold">{tenant.minCondition}%</p>
                    </div>
                  </div>

                  <button
                    onClick={() => selectTenant(tenant)}
                    disabled={!canAfford}
                    className={`w-full py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      canAfford
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? (
                      <>
                        <CheckCircle size={16} />
                        Mieter auswählen
                      </>
                    ) : (
                      <>
                        <AlertCircle size={16} />
                        Zustand zu niedrig
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-800 p-4 bg-slate-900">
            <button
              onClick={() => setShowTenantModal(false)}
              className="w-full bg-slate-700 hover:bg-slate-600 py-2.5 rounded-lg font-medium transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 w-full overflow-x-hidden pb-20 lg:pb-0">
      {/* Tenant Modal */}
      <TenantModal />

      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="w-full max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4 lg:mb-0">
            <div className="flex items-center gap-2">
              <Building2 className="text-emerald-500" size={28} />
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-slate-100">ImmoTycoon</h1>
                <p className="text-xs text-slate-400 hidden sm:block">Dein Immobilien-Imperium</p>
              </div>
            </div>

            <button
              onClick={resetGame}
              className="bg-red-600 hover:bg-red-700 p-2 rounded-lg transition-colors"
              title="Spiel zurücksetzen"
            >
              <Trash2 size={18} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 lg:flex lg:items-center gap-2 lg:gap-4">
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

      {/* Tab Navigation */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-[132px] lg:top-[116px] z-10">
        <div className="w-full max-w-7xl mx-auto px-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('properties')}
              className={`flex-1 lg:flex-none px-6 py-3 font-medium transition-colors flex items-center justify-center gap-2 border-b-2 ${
                activeTab === 'properties'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <Building2 size={18} />
              <span>Immobilien</span>
            </button>
            <button
              onClick={() => setActiveTab('shop')}
              className={`flex-1 lg:flex-none px-6 py-3 font-medium transition-colors flex items-center justify-center gap-2 border-b-2 ${
                activeTab === 'shop'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <Store size={18} />
              <span>Shop</span>
              {upgrades.filter(u => !u.purchased).length > 0 && (
                <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {upgrades.filter(u => !u.purchased).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('finance')}
              className={`flex-1 lg:flex-none px-6 py-3 font-medium transition-colors flex items-center justify-center gap-2 border-b-2 ${
                activeTab === 'finance'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <Landmark size={18} />
              <span>Bank</span>
              {debt > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {Math.round(debt / 1000)}k
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-7xl mx-auto px-4 py-6 lg:py-8">
        {activeTab === 'properties' && (
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
            {/* Immobilienmarkt */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6">
                <ShoppingCart className="text-blue-500" size={20} />
                <h2 className="text-xl lg:text-2xl font-bold">Immobilienmarkt</h2>
                <span className="bg-slate-800 px-2 py-0.5 lg:px-3 lg:py-1 rounded-full text-xs lg:text-sm text-slate-400">
                  {marketProperties.length}
                </span>
              </div>

              <div className="space-y-4">
                {marketProperties.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:p-8 text-center">
                    <AlertCircle className="mx-auto text-slate-600 mb-3" size={40} />
                    <p className="text-slate-400 text-sm lg:text-base">Keine Immobilien verfügbar</p>
                  </div>
                ) : (
                  marketProperties.map(property => (
                    <PropertyCard key={property.id} property={property} isMarket={true} />
                  ))
                )}
              </div>
            </div>

            {/* Portfolio */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6">
                <Home className="text-emerald-500" size={20} />
                <h2 className="text-xl lg:text-2xl font-bold">Mein Portfolio</h2>
                <span className="bg-slate-800 px-2 py-0.5 lg:px-3 lg:py-1 rounded-full text-xs lg:text-sm text-slate-400">
                  {portfolio.length}
                </span>
              </div>

              <div className="space-y-4">
                {portfolio.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:p-8 text-center">
                    <Building2 className="mx-auto text-slate-600 mb-3" size={40} />
                    <p className="text-slate-400 text-sm lg:text-base">Portfolio leer</p>
                  </div>
                ) : (
                  portfolio.map(property => (
                    <PropertyCard key={property.id} property={property} isMarket={false} />
                  ))
                )}
              </div>
            </div>

            {/* Event Log */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6">
                <ScrollText className="text-purple-500" size={20} />
                <h2 className="text-xl lg:text-2xl font-bold">Ereignisse</h2>
              </div>

              <div className="space-y-3">
                {eventLog.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
                    <ScrollText className="mx-auto text-slate-600 mb-3" size={40} />
                    <p className="text-slate-400 text-sm">Keine Ereignisse</p>
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

              {upgrades.filter(u => u.purchased).length > 0 && (
                <div className="mt-6 bg-slate-900 border border-emerald-500/30 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                    <Zap size={16} />
                    Aktive Upgrades
                  </h3>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {upgrades.filter(u => u.purchased).map(upgrade => (
                      <li key={upgrade.id} className="flex items-center gap-2">
                        <CheckCircle size={12} className="text-emerald-400" />
                        {upgrade.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Store className="text-emerald-500" size={24} />
              <h2 className="text-2xl font-bold">Upgrade-Shop</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {upgrades.map(upgrade => {
                const Icon = getIconComponent(upgrade.iconName);
                return (
                  <div
                    key={upgrade.id}
                    className={`bg-slate-900 border rounded-xl p-5 lg:p-6 ${
                      upgrade.purchased 
                        ? 'border-emerald-500/30 bg-emerald-500/5' 
                        : 'border-slate-800 hover:border-slate-700'
                    } transition-colors`}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`p-3 rounded-xl ${
                        upgrade.purchased 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        <Icon size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">{upgrade.name}</h3>
                        <p className="text-sm text-slate-400">{upgrade.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-400">
                          {upgrade.price.toLocaleString('de-DE')} €
                        </p>
                        <p className="text-xs text-slate-500">Preis</p>
                      </div>

                      <button
                        onClick={() => buyUpgrade(upgrade.id)}
                        disabled={upgrade.purchased || cash < upgrade.price}
                        className={`px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                          upgrade.purchased
                            ? 'bg-emerald-600/30 text-emerald-400 cursor-default'
                            : cash < upgrade.price
                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {upgrade.purchased ? (
                          <>
                            <CheckCircle size={16} />
                            Im Besitz
                          </>
                        ) : cash < upgrade.price ? (
                          <>
                            <AlertCircle size={16} />
                            Zu teuer
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={16} />
                            Kaufen
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Finance Tab */}
        {activeTab === 'finance' && (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Landmark className="text-emerald-500" size={24} />
              <h2 className="text-2xl font-bold">Finanzen & Bank</h2>
            </div>

            {/* Finanz-Übersicht */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Coins className="text-amber-500" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Bargeld</p>
                    <p className="text-2xl font-bold text-slate-100">{cash.toLocaleString('de-DE')} €</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <Building2 className="text-emerald-500" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Immobilienvermögen</p>
                    <p className="text-2xl font-bold text-emerald-400">{calculatePropertyValue().toLocaleString('de-DE')} €</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <TrendingDown className="text-red-500" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Offene Kredite</p>
                    <p className="text-2xl font-bold text-red-400">{debt.toLocaleString('de-DE')} €</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <PiggyBank className="text-purple-500" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Nettovermögen</p>
                    <p className={`text-2xl font-bold ${calculateNetWorth() >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {calculateNetWorth().toLocaleString('de-DE')} €
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Verschuldungsgrad */}
            {calculatePropertyValue() > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-8">
                <h3 className="text-lg font-semibold mb-3">Verschuldungsgrad</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Schulden / Immobilienwert</span>
                    <span className="font-semibold">{calculateLeverageRatio()}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        calculateLeverageRatio() > 70 ? 'bg-red-500' : 
                        calculateLeverageRatio() > 40 ? 'bg-amber-500' : 
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${calculateLeverageRatio()}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {calculateLeverageRatio() > 70 ? '⚠️ Hohes Risiko' : 
                     calculateLeverageRatio() > 40 ? '⚡ Moderates Risiko' : 
                     '✅ Niedriges Risiko'}
                  </p>
                </div>
              </div>
            )}

            {/* Monatliche Zinslast */}
            {debt > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 mb-8">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-red-400" size={24} />
                  <div>
                    <p className="text-sm font-semibold text-red-400">Monatliche Zinslast</p>
                    <p className="text-xs text-slate-400">5% deiner Schulden werden jeden Monat fällig</p>
                    <p className="text-lg font-bold text-red-400 mt-1">-{calculateInterest().toLocaleString('de-DE')} € pro Monat</p>
                  </div>
                </div>
              </div>
            )}

            {/* Kredit-Aktionen */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Landmark size={20} />
                Kredit-Management
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => takeOutLoan(5000)}
                  className="bg-emerald-600 hover:bg-emerald-700 px-6 py-4 rounded-lg font-medium transition-colors flex flex-col items-center gap-2"
                >
                  <TrendingUp size={24} />
                  <span>Kredit aufnehmen</span>
                  <span className="text-sm opacity-80">+5.000 €</span>
                </button>

                <button
                  onClick={() => repayLoan(5000)}
                  disabled={debt === 0 || cash < 5000}
                  className="bg-amber-600 hover:bg-amber-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed px-6 py-4 rounded-lg font-medium transition-colors flex flex-col items-center gap-2"
                >
                  <TrendingDown size={24} />
                  <span>Kredit zurückzahlen</span>
                  <span className="text-sm opacity-80">-5.000 €</span>
                </button>
              </div>

              <div className="mt-6 p-4 bg-slate-800 rounded-lg">
                <p className="text-xs text-slate-400 mb-2">💡 Hinweise zum Kredit-System:</p>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• Kredite kosten 5% Zinsen pro Monat</li>
                  <li>• Nutze Kredite, um schneller zu expandieren</li>
                  <li>• Achte auf deinen Cashflow (Miete - Zinsen)</li>
                  <li>• Bei unter -5.000 € Bargeld: BANKROTT!</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
