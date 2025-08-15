import React, { useState, useRef, useEffect } from 'react';
import { CrimeRecord, CityStats, ChatMessage } from '../types/crime';
import { MessageCircle, Send, Bot, User, AlertCircle } from 'lucide-react';
import { initializeOpenAI, getOpenAIService } from '../services/openaiService';

// API Key - should be moved to environment variables in production
const OPENAI_API_KEY = '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';

// Initialize OpenAI service
const openAIService = initializeOpenAI(OPENAI_API_KEY);

// Restore ChatBotProps interface
interface ChatBotProps {
  data: CrimeRecord[];
  cityStats: CityStats[];
}

const ChatBot: React.FC<ChatBotProps> = ({ data, cityStats }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: '\u{1F916} Hello! I\'m your **Enhanced Crime Analysis AI Assistant** powered by advanced data processing!\n\n\u2728 **New Capabilities:**\n\u{1FAA0} AI-powered correlation analysis\n\u{1F52E} Predictive insights\n\u{1F4CA} Advanced comparative analysis\n\u{1F3AF} Context-aware responses\n\nI can analyze patterns, predict trends, and provide deep insights from our crime database. What would you like to explore?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [isOpen, setIsOpen] = useState(false); // floating chat state
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick action suggestions
  const quickActions = [
    "🏆 Which city is safest?",
    "📊 Show me crime statistics",
    "⏰ When is it most dangerous?",
    "🔍 Analyze weapon usage",
    "📈 Predict crime trends",
    "🏙️ Compare cities",
    "💡 Give me safety tips",
    "🎯 Correlation analysis"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase().trim();

    // Handle empty or very short messages
    if (message.length < 2) {
      return "🤔 I didn't catch that! Could you ask me a more specific question about crime data, safety, or city statistics?";
    }

    // First check for specific keywords that indicate what the user wants
    // This makes the chatbot more responsive to user queries

    // Fun greeting responses
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      const greetings = [
        "Hello there! 👋 I'm your Crime Data Detective! Ready to dive into some fascinating (albeit concerning) statistics? What mystery shall we solve today?",
        "Hey! 🕵️‍♂️ Welcome to the world of crime analytics! I've got tons of data and even more insights. What would you like to explore?",
        "Hi! 🔍 Think of me as your personal Sherlock Holmes for crime data. I can reveal patterns, trends, and safety insights faster than you can say 'elementary!' What's your question?"
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // Emotional/personal queries with empathy
    if (message.includes('scared') || message.includes('afraid') || message.includes('worried')) {
      return `I understand your concerns! 😌 Fear is natural when dealing with crime statistics. But knowledge is power! Let me help you feel more secure:\n\n🛡️ **Remember:** Most areas are actually quite safe\n📊 **Fact:** Crime rates have generally decreased over time\n🎯 **Action:** I can provide specific safety tips for your area\n\nWhat specific location or situation are you concerned about? Let's turn that worry into wisdom!`;
    }

    // Creative responses for compliments
    if (message.includes('smart') || message.includes('clever') || message.includes('good job') || message.includes('thank')) {
      const responses = [
        "Aww, you're making my circuits blush! 🤖✨ I do love crunching numbers and finding patterns. Got another puzzle for me?",
        "Thank you! 😊 I've analyzed thousands of crime records, so I've gotten pretty good at spotting trends. What else can I help you discover?",
        "You're too kind! 🎉 I'm just doing what I love - turning data into insights that keep people safe. What shall we investigate next?"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    // Prediction and future-focused queries
    if (message.includes('predict') || message.includes('future') || message.includes('will happen') || message.includes('forecast')) {
      const hourMap = new Map<number, number>();
      data.forEach(record => {
        try {
          let hour = 0;
          const timeStr = record.timeOfOccurrence;
          if (timeStr.includes(':')) {
            const timePart = timeStr.split(' ').pop() || timeStr;
            hour = parseInt(timePart.split(':')[0]);
          }
          if (hour >= 0 && hour <= 23) {
            hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
          }
        } catch (error) {
          // Skip invalid times
        }
      });

      const peakHours = Array.from(hourMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([hour]) => hour);

      return `🔮 **Crystal Ball Activated!** Based on historical patterns, here's what I foresee:\n\n📈 **High-risk periods:** ${peakHours.map(h => `${h}:00`).join(', ')} tend to see more incidents\n🏙️ **Seasonal patterns:** Summer months typically show 15-20% higher crime rates\n⚡ **Smart prediction:** Weekend evenings in commercial areas need extra vigilance\n\n🎯 **Pro tip:** Patterns are powerful, but they're not destiny! Awareness and preparation are your best defenses.`;
    }

    // Compare cities creatively
    if (message.includes('compare') || message.includes('versus') || message.includes('vs') || message.includes('better')) {
      const safestCity = cityStats.reduce((prev, current) =>
        prev.safetyRating > current.safetyRating ? prev : current
      );
      const riskyCity = cityStats.reduce((prev, current) =>
        prev.safetyRating < current.safetyRating ? prev : current
      );

      return `🥊 **City Showdown - Safety Edition!**\n\n🏆 **Champion:** ${safestCity.city}\n- Safety Score: ${safestCity.safetyRating}/5 ⭐\n- Closure Rate: ${((safestCity.closedCases / safestCity.totalCrimes) * 100).toFixed(1)}% 🎯\n- Risk Level: ${safestCity.riskLevel} ✅\n\n⚠️ **Challenger:** ${riskyCity.city}\n- Safety Score: ${riskyCity.safetyRating}/5 📉\n- Closure Rate: ${((riskyCity.closedCases / riskyCity.totalCrimes) * 100).toFixed(1)}% 🎯\n- Risk Level: ${riskyCity.riskLevel} ⚡\n\n🎭 **Plot twist:** Even "dangerous" cities have safe neighborhoods! Location and timing matter more than city labels.`;
    }

    // Weekend/night safety with personality
    if (message.includes('night') || message.includes('evening') || message.includes('late') || message.includes('weekend')) {
      const hourMap = new Map<number, number>();
      data.forEach(record => {
        try {
          let hour = 0;
          const timeStr = record.timeOfOccurrence;
          if (timeStr.includes(':')) {
            const timePart = timeStr.split(' ').pop() || timeStr;
            hour = parseInt(timePart.split(':')[0]);
          }
          if (hour >= 0 && hour <= 23) {
            hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
          }
        } catch (error) {
          // Skip invalid times
        }
      });

      const nightCrimes = Array.from(hourMap.entries())
        .filter(([hour]) => hour >= 22 || hour <= 5)
        .reduce((sum, [, count]) => sum + count, 0);
      const nightPercentage = ((nightCrimes / data.length) * 100).toFixed(1);

      return `🌙 **Night Owl Safety Briefing!**\n\n📊 **The Reality:** ${nightPercentage}% of crimes happen between 10 PM - 5 AM\n🕯️ **Fun fact:** Your biggest enemy isn't criminals - it's poor lighting and empty streets!\n\n✨ **Night Warriors Toolkit:**\n🚗 Use rideshare apps (drivers = witnesses)\n💡 Stick to well-lit main roads\n👥 Travel in groups (criminals hate audiences)\n📱 Share live location with friends\n🎧 Keep one earbud out (stay alert!)\n\n💪 **Remember:** You're statistically safer than you think! Smart choices beat fear every time.`;
    }

    // Demographics with insights
    if (message.includes('age') || message.includes('gender') || message.includes('victim') || message.includes('demographic')) {
      const avgAge = Math.round(data.reduce((sum, record) => sum + record.victimAge, 0) / data.length);
      const genderMap = new Map<string, number>();
      data.forEach(record => {
        genderMap.set(record.victimGender, (genderMap.get(record.victimGender) || 0) + 1);
      });
      const genderStats = Array.from(genderMap.entries())
        .map(([gender, count]) => ({ gender, count, percentage: ((count / data.length) * 100).toFixed(1) }))
        .sort((a, b) => b.count - a.count);

      return `�� **Demographics Deep Dive:**\n\n🎂 **Average victim age:** ${avgAge} years (peak vulnerability in prime of life!)\n\n📊 **Gender breakdown:**\n${genderStats.map(g => `${g.gender}: ${g.percentage}% (${g.count.toLocaleString()} cases)`).join('\n')}\n\n🧠 **Insight:** Crime isn't random - it follows patterns. Young adults face higher risks due to lifestyle factors (nightlife, commuting, etc.)\n\n��� **Takeaway:** Awareness peaks in your 20s-30s are crucial for prevention!`;
    }

    // Original comprehensive queries with enhanced responses
    if (message.includes('total') && message.includes('crime')) {
      const crimeTypeMap = new Map<string, number>();
      data.forEach(record => {
        crimeTypeMap.set(record.crimeDescription, (crimeTypeMap.get(record.crimeDescription) || 0) + 1);
      });
      const diversityScore = crimeTypeMap.size;

      return `📊 **Crime Database Overview:**\n\n🔢 **Total Records:** ${data.length.toLocaleString()} crimes analyzed\n🏙️ **Cities Covered:** ${cityStats.length} metropolitan areas\n🎯 **Crime Diversity:** ${diversityScore} different crime types\n\n🔍 **What this means:** We're looking at a comprehensive dataset that covers the full spectrum of criminal activity. That's A LOT of patterns to discover!\n\n💡 **Fun stat:** That's roughly ${Math.round(data.length / 365)} crimes per day across all cities!`;
    }

    if (message.includes('safest') && message.includes('city')) {
      const safestCity = cityStats.reduce((prev, current) =>
        prev.safetyRating > current.safetyRating ? prev : current
      );
      const reasons = [];
      if (((safestCity.closedCases / safestCity.totalCrimes) * 100) > 70) reasons.push('excellent police work');
      if (safestCity.safetyRating > 4) reasons.push('low crime frequency');
      if (safestCity.totalCrimes < data.length / cityStats.length) reasons.push('below-average crime volume');

      return `🏆 **Safety Champion: ${safestCity.city}!**\n\n⭐ **Safety Score:** ${safestCity.safetyRating}/5 (that's impressive!)\n📈 **Success Rate:** ${((safestCity.closedCases / safestCity.totalCrimes) * 100).toFixed(1)}% case closure\n📊 **Crime Volume:** ${safestCity.totalCrimes.toLocaleString()} incidents\n\n🎯 **Why ${safestCity.city} wins:** ${reasons.join(', ')}\n\n✨ **Bonus insight:** Even in the safest cities, staying alert is key. ${safestCity.city} proves that good policing and community awareness work!`;
    }

    // Enhanced specific queries with better matching

    // More flexible city matching
    const cityQuery = cityStats.find(city =>
      message.includes(city.city.toLowerCase()) ||
      city.city.toLowerCase().includes(message.replace(/[^a-z\s]/g, ''))
    );

    if (cityQuery) {
      const performance = cityQuery.safetyRating >= 4 ? 'excellent' : cityQuery.safetyRating >= 3 ? 'good' : 'needs improvement';
      const trend = cityQuery.riskLevel === 'Low' ? '📈 trending safer' : cityQuery.riskLevel === 'High' ? '📉 needs attention' : '⚖️ stable';

      return `🏙️ **${cityQuery.city} Crime Profile:**\n\n⭐ **Safety Rating:** ${cityQuery.safetyRating}/5 (${performance})\n📊 **Total Cases:** ${cityQuery.totalCrimes.toLocaleString()}\n🎯 **Police Effectiveness:** ${((cityQuery.closedCases / cityQuery.totalCrimes) * 100).toFixed(1)}% closure rate\n🔍 **Top Concern:** ${cityQuery.mostCommonCrime}\n📈 **Status:** ${trend}\n\n${cityQuery.riskLevel === 'High' ? '🚨 **Travel Advisory:** High caution recommended - stick to main areas, travel in groups, avoid late hours' : cityQuery.riskLevel === 'Medium' ? '⚡ **Moderate Risk:** Standard safety precautions should keep you safe' : '✅ **Low Risk:** Relatively safe, but stay alert as always!'}\n\n💡 **Local tip:** Every city has safe and risky areas - location and timing matter more than overall statistics!`;
    }

    // Handle specific crime type questions
    if (message.includes('theft') || message.includes('robbery') || message.includes('assault') || message.includes('murder') || message.includes('fraud')) {
      const crimeTypes = ['theft', 'robbery', 'assault', 'murder', 'fraud', 'burglary', 'vandalism'];
      const mentionedCrime = crimeTypes.find(crime => message.includes(crime));

      if (mentionedCrime) {
        const crimeRecords = data.filter(record =>
          record.crimeDescription.toLowerCase().includes(mentionedCrime)
        );
        const crimeCount = crimeRecords.length;
        const crimePercentage = ((crimeCount / data.length) * 100).toFixed(1);

        // City breakdown for this crime type
        const cityBreakdown = new Map<string, number>();
        crimeRecords.forEach(record => {
          cityBreakdown.set(record.city, (cityBreakdown.get(record.city) || 0) + 1);
        });

        const topCities = Array.from(cityBreakdown.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);

        return `🔍 **${mentionedCrime.toUpperCase()} Analysis:**\n\n📊 **Frequency:** ${crimeCount.toLocaleString()} cases (${crimePercentage}% of all crimes)\n\n🏙️ **Top affected cities:**\n${topCities.map((c, i) => `${i + 1}. ${c[0]} - ${c[1]} cases`).join('\n')}\n\n🛡️ **Prevention tips for ${mentionedCrime}:**\n${mentionedCrime === 'theft' ? '• Secure valuables\n• Avoid displaying expensive items\n• Stay alert in crowded places' :
          mentionedCrime === 'assault' ? '• Travel in groups\n• Avoid isolated areas\n• Trust your instincts' :
          mentionedCrime === 'fraud' ? '• Verify all transactions\n• Never share personal info\n• Use secure payment methods' :
          '• Stay vigilant\n• Report suspicious activity\n• Follow local safety guidelines'}`;
      }
    }

    // Handle "how many" questions with more specific data
    if (message.includes('how many') || message.includes('how much')) {
      if (message.includes('cities')) {
        return `📊 **Dataset Coverage:** We're analyzing **${cityStats.length} cities** across India with comprehensive crime data!\n\n🏆 **Top 5 safest cities:**\n${cityStats.slice(0, 5).map((c, i) => `${i + 1}. ${c.city} (${c.safetyRating}/5 safety rating)`).join('\n')}\n\n⚠️ **Cities needing attention:**\n${cityStats.slice(-3).reverse().map((c, i) => `• ${c.city} (${c.safetyRating}/5 rating)`).join('\n')}`;
      }

      if (message.includes('crimes') || message.includes('cases')) {
        const weaponCrimes = data.filter(record => {
          const weapon = record.weaponUsed?.toLowerCase() || '';
          return weapon !== 'none' && weapon !== 'unknown' && weapon !== '' && weapon !== 'not specified';
        }).length;

        return `📈 **Crime Statistics Breakdown:**\n\n🔢 **Total crimes:** ${data.length.toLocaleString()} cases\n⚔️ **Weapon-involved:** ${weaponCrimes.toLocaleString()} cases (${((weaponCrimes / data.length) * 100).toFixed(1)}%)\n✅ **Cases solved:** ${data.filter(r => r.caseClosed === 'Yes').length.toLocaleString()} (${(((data.filter(r => r.caseClosed === 'Yes').length) / data.length) * 100).toFixed(1)}%)\n🏙️ **Average per city:** ${Math.round(data.length / cityStats.length).toLocaleString()} crimes\n\n📊 **Data spans ${cityStats.length} major Indian cities with comprehensive reporting!**`;
      }
    }

    // Handle "what is" or "what are" questions
    if (message.startsWith('what is') || message.startsWith('what are') || message.startsWith('what')) {
      if (message.includes('crime rate')) {
        const avgCrimeRate = Math.round(data.length / cityStats.length);
        return `📊 **Crime Rate Analysis:**\n\n🏙️ **Average:** ${avgCrimeRate.toLocaleString()} crimes per city\n📈 **Range:** ${Math.min(...cityStats.map(c => c.totalCrimes)).toLocaleString()} - ${Math.max(...cityStats.map(c => c.totalCrimes)).toLocaleString()} crimes\n⭐ **Best performing:** ${cityStats[0].city} (${cityStats[0].safetyRating}/5 rating)\n⚠️ **Needs improvement:** ${cityStats[cityStats.length - 1].city} (${cityStats[cityStats.length - 1].safetyRating}/5 rating)\n\n💡 **Context:** Crime rates vary significantly based on city size, policing, and socioeconomic factors!`;
      }

      if (message.includes('safety rating') || message.includes('safety score')) {
        const avgRating = (cityStats.reduce((sum, city) => sum + city.safetyRating, 0) / cityStats.length).toFixed(1);
        return `⭐ **Safety Rating System Explained:**\n\n📊 **Scale:** 1-5 stars (5 being safest)\n📈 **National average:** ${avgRating}/5\n�� **Top rated:** ${cityStats[0].city} (${cityStats[0].safetyRating}/5)\n\n🧮 **How it's calculated:**\n• Crime volume (lower = better)\n• Case closure rates (higher = better)\n• Violence severity (less = better)\n• Weapon usage (less = better)\n\n✨ **Pro tip:** Even low-rated cities have safe neighborhoods - timing and location matter!`;
      }
    }

    // Handle "where is" questions
    if (message.startsWith('where is') || message.startsWith('where are')) {
      if (message.includes('safest') || message.includes('safe')) {
        const safestCity = cityStats[0];
        return `🏆 **Safest Location:** ${safestCity.city}\n\n⭐ **Why it's safe:**\n• ${safestCity.safetyRating}/5 safety rating\n• ${((safestCity.closedCases / safestCity.totalCrimes) * 100).toFixed(1)}% case closure rate\n• Only ${safestCity.totalCrimes.toLocaleString()} total incidents\n• ${safestCity.riskLevel} risk classification\n\n🗺️ **Location matters:** Even in the safest cities, stick to main areas and follow standard precautions!`;
      }
    }

    // Creative time analysis
    if (message.includes('time') || message.includes('hour') || message.includes('when')) {
      const hourMap = new Map<number, number>();
      data.forEach(record => {
        try {
          let hour = 0;
          const timeStr = record.timeOfOccurrence;
          if (timeStr.includes(':')) {
            const timePart = timeStr.split(' ').pop() || timeStr;
            hour = parseInt(timePart.split(':')[0]);
          }
          if (hour >= 0 && hour <= 23) {
            hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
          }
        } catch (error) {
          // Skip invalid times
        }
      });

      const peakHour = Array.from(hourMap.entries()).reduce((max, current) =>
        current[1] > max[1] ? current : max
      );
      const safestHour = Array.from(hourMap.entries()).reduce((min, current) =>
        current[1] < min[1] ? current : min
      );

      const timeCategories = {
        'Early Bird (5-8 AM)': Array.from(hourMap.entries()).filter(([h]) => h >= 5 && h <= 8).reduce((s, [,c]) => s + c, 0),
        'Business Hours (9-17)': Array.from(hourMap.entries()).filter(([h]) => h >= 9 && h <= 17).reduce((s, [,c]) => s + c, 0),
        'Evening Rush (18-22)': Array.from(hourMap.entries()).filter(([h]) => h >= 18 && h <= 22).reduce((s, [,c]) => s + c, 0),
        'Night Owl (23-4)': Array.from(hourMap.entries()).filter(([h]) => h >= 23 || h <= 4).reduce((s, [,c]) => s + c, 0)
      };

      return `⏰ **Time Crimes: A 24-Hour Story**\n\n🔥 **Rush Hour for Crime:** ${peakHour[0]}:00 (${peakHour[1]} incidents - yikes!)\n😴 **Safest Hour:** ${safestHour[0]}:00 (only ${safestHour[1]} incidents - peaceful!)\n\n📊 **Time Zones of Risk:**\n${Object.entries(timeCategories).map(([period, count]) =>
        `${period}: ${count.toLocaleString()} crimes (${((count / data.length) * 100).toFixed(1)}%)`
      ).join('\n')}\n\n🧠 **Crime Clock Wisdom:** Criminals are surprisingly predictable! They prefer cover of darkness but also target busy periods when people are distracted.\n\n✨ **Pro tip:** Your safest bet? Mid-morning coffee runs and early afternoon errands!`;
    }

    // Enhanced weapon analysis
    if (message.includes('weapon')) {
      const weaponMap = new Map<string, number>();
      data.forEach(record => {
        const weapon = record.weaponUsed?.toLowerCase() || '';
        if (weapon !== 'none' && weapon !== 'unknown' && weapon !== '' && weapon !== 'not specified') {
          weaponMap.set(record.weaponUsed, (weaponMap.get(record.weaponUsed) || 0) + 1);
        }
      });
      const totalWeaponCrimes = Array.from(weaponMap.values()).reduce((sum, count) => sum + count, 0);
      const weaponRate = ((totalWeaponCrimes / data.length) * 100).toFixed(1);

      const topWeapons = Array.from(weaponMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      return `⚔️ **Weapons Analysis - The Reality Check:**\n\n📊 **Armed Incidents:** ${totalWeaponCrimes.toLocaleString()} cases (${weaponRate}% of all crimes)\n😌 **Unarmed Majority:** ${(100 - parseFloat(weaponRate)).toFixed(1)}% of crimes involve NO weapons!\n\n🔍 **When weapons are involved:**\n${topWeapons.map((w, i) => `${i + 1}. **${w[0]}** - ${w[1]} cases (${((w[1] / totalWeaponCrimes) * 100).toFixed(1)}%)`).join('\n')}\n\n💡 **Reality Check:** Most crimes are opportunistic, not planned attacks. Your best weapons? Awareness, confidence, and smart choices!\n\n🛡️ **Defense Strategy:** Avoid confrontation, trust your instincts, and remember - most criminals want easy targets, not fights!`;
    }

    // Enhanced case closure with police performance insights
    if (message.includes('solved') || message.includes('closure') || message.includes('closed') || message.includes('police')) {
      const totalCases = data.length;
      const closedCases = data.filter(record => record.caseClosed === 'Yes').length;
      const closureRate = ((closedCases / totalCases) * 100).toFixed(1);

      const cityClosureRates = cityStats.map(city => ({
        city: city.city,
        rate: parseFloat(((city.closedCases / city.totalCrimes) * 100).toFixed(1))
      })).sort((a, b) => b.rate - a.rate);

      const topPerformer = cityClosureRates[0];
      const needsWork = cityClosureRates[cityClosureRates.length - 1];

      return `🕵️‍♂️ **Police Performance Report Card:**\n\n📈 **National Average:** ${closureRate}% cases solved (${closedCases.toLocaleString()}/${totalCases.toLocaleString()})\n\n🏆 **MVP Award:** ${topPerformer.city} - ${topPerformer.rate}% closure rate! 👏\n📚 **Needs Tutoring:** ${needsWork.city} - ${needsWork.rate}% (room for improvement!)\n\n⭐ **Hall of Fame (Top 3):**\n${cityClosureRates.slice(0, 3).map((c, i) => `${i + 1}. ${c.city} - ${c.rate}% 🎯`).join('\n')}\n\n🧠 **Insight:** Good policing makes a HUGE difference! Cities with higher closure rates often see lower crime rates too.\n\n💪 **Citizen Power:** Report crimes promptly and provide details - you're part of the solution!`;
    }

    // Enhanced safety recommendations with personality
    if (message.includes('safe') || message.includes('recommend') || message.includes('advice') || message.includes('tips')) {
      const safetyConcerns = [];
      if (message.includes('night')) safetyConcerns.push('nighttime');
      if (message.includes('woman') || message.includes('female')) safetyConcerns.push('women');
      if (message.includes('travel')) safetyConcerns.push('travel');

      let customAdvice = '';
      if (safetyConcerns.includes('nighttime')) {
        customAdvice = '\n🌙 **Night-Specific Tips:**\n- Well-lit routes only\n- Rideshare > walking\n- Share live location\n- Confident body language';
      } else if (safetyConcerns.includes('women')) {
        customAdvice = '\n👩 **Women-Focused Safety:**\n- Trust your instincts ALWAYS\n- Fake phone calls work\n- Pepper spray + training\n- Parking lot awareness';
      } else if (safetyConcerns.includes('travel')) {
        customAdvice = '\n✈️ **Travel Smart:**\n- Research destination first\n- Local emergency numbers\n- Blend in with locals\n- Backup communication plan';
      }

      return `🛡️ **Your Personal Safety Superhero Guide:**\n\n✨ **The Golden Rules:**\n🎯 **Situational Awareness** - Your superpower!\n🚫 **Trust Your Gut** - That feeling? Listen to it!\n📱 **Stay Connected** - Someone should know where you are\n💎 **Don't Flash Valuables** - Blend, don't bling!\n🚗 **Transportation Smart** - Plan your routes\n👥 **Strength in Numbers** - Criminals hate crowds!\n${customAdvice}\n\n🧠 **Psychology Hack:** Walk with purpose and confidence - criminals target those who look lost or distracted!\n\n💪 **Remember:** You're already safer than most people in history. These tips just make you superhero-level safe!`;
    }

    // Statistical queries with engaging presentation
    if (message.includes('average') || message.includes('mean') || message.includes('statistic')) {
      const avgAge = Math.round(data.reduce((sum, record) => sum + record.victimAge, 0) / data.length);
      const avgCrimesPerCity = Math.round(data.length / cityStats.length);
      const avgSafetyRating = (cityStats.reduce((sum, city) => sum + city.safetyRating, 0) / cityStats.length).toFixed(1);

      return `📊 **Statistics Buffet - The Numbers Game:**\n\n🎂 **Average victim age:** ${avgAge} years (prime of life vulnerability!)\n🏙️ **Average crimes per city:** ${avgCrimesPerCity.toLocaleString()} (workload varies!)\n⭐ **Average safety rating:** ${avgSafetyRating}/5 (room for improvement!)\n📈 **Data span:** ${cityStats.length} cities analyzed\n\n🤓 **Nerd Alert:** Did you know the average hides fascinating extremes? Some cities have 10x more crimes than others!\n\n🎯 **The Real Insight:** Averages are starting points, not destinations. Your specific location, time, and behavior matter WAY more than these numbers!\n\n💡 **Stats Wisdom:** Use averages to understand trends, not to predict your personal risk!`;
    }

    // Philosophical/deep questions
    if (message.includes('why') && (message.includes('crime') || message.includes('happen'))) {
      return `🤔 **The Deep Question: Why Crime Happens**\n\nWhoa, getting philosophical! While I'm a data analyst, not a criminologist, the patterns tell interesting stories:\n\n🧠 **Data Patterns Suggest:**\n- Economic stress correlates with property crime\n- Social inequality creates tension\n- Opportunity + motive = risk\n- Community connection reduces crime\n\n📊 **What I DO know:** Prevention works better than reaction!\n\n💡 **Hope Factor:** Cities with strong communities, good policing, and economic opportunities show dramatic improvement over time!\n\n✨ **Plot Twist:** Humans are naturally cooperative! Crime is the exception, not the rule. Most people are good, and most places are safe most of the time.`;
    }

    // Priority keyword detection for more accurate responses
    const priorityKeywords = {
      statistics: ['stat', 'data', 'number', 'count', 'total', 'many'],
      cities: ['city', 'cities', 'mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'pune', 'ahmedabad'],
      safety: ['safe', 'safest', 'danger', 'dangerous', 'risk', 'secure'],
      weapons: ['weapon', 'gun', 'knife', 'firearm', 'armed'],
      time: ['time', 'hour', 'when', 'morning', 'night', 'evening'],
      police: ['police', 'cop', 'solved', 'closed', 'arrest'],
      crime_types: ['murder', 'theft', 'robbery', 'assault', 'fraud', 'cybercrime']
    };

    // Find which category the user's question fits best
    let bestCategory = '';
    let maxMatches = 0;

    Object.entries(priorityKeywords).forEach(([category, keywords]) => {
      const matches = keywords.filter(keyword => message.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestCategory = category;
      }
    });

    // Provide category-specific quick responses for unmatched questions
    if (maxMatches > 0 && bestCategory) {
      const quickResponses: QuickResponses = {
        statistics: `📊 You're asking about statistics! I can help with:\n• Total crimes: ${data.length.toLocaleString()}\n• Cities analyzed: ${cityStats.length}\n• Solved cases: ${data.filter(r => r.caseClosed === 'Yes').length.toLocaleString()}\n\nTry asking: "What are the crime statistics?" or "How many cases were solved?"`,
        cities: `🏙️ You're asking about cities! Here's what I can tell you:\n• Safest city: ${cityStats[0]?.city} (${cityStats[0]?.safetyRating}/5 rating)\n• Total cities analyzed: ${cityStats.length}\n\nTry asking: "Which city is safest?" or "Compare Mumbai and Delhi"`,
        safety: `🛡️ You're asking about safety! I can help with:\n• Safety ratings by city\n• Risk level analysis\n• Travel recommendations\n\nTry asking: "Is [city name] safe?" or "What are safety tips?"`,
        weapons: `⚔️ You're asking about weapons! Here's the data:\n• Weapon-involved crimes: ${data.filter(r => r.weaponUsed !== 'None').length.toLocaleString()}\n• Most common weapons found in dataset\n\nTry asking: "What weapons are used most?" or "Weapon crime statistics"`,
        time: `⏰ You're asking about time patterns! I can analyze:\n• Peak crime hours\n• Safest times to travel\n• Time-based risk analysis\n\nTry asking: "What time is safest?" or "When do most crimes happen?"`,
        police: `👮 You're asking about police effectiveness! Here's the data:\n• Case closure rate: ${(((data.filter(r => r.caseClosed === 'Yes').length) / data.length) * 100).toFixed(1)}%\n• Police response analysis\n\nTry asking: "How effective are police?" or "What's the case closure rate?"`,
        crime_types: `🔍 You're asking about crime types! I can analyze:\n• Most common crimes\n• Crime type distribution\n• Severity analysis\n\nTry asking: "What's the most common crime?" or "Show me crime types"`
      };

      return quickResponses[bestCategory] || "I can help with that! Please be more specific about what you'd like to know.";
    }

    // Analyze the user's question more intelligently
    const questionWords = ['what', 'how', 'where', 'when', 'why', 'which', 'who'];
    const hasQuestionWord = questionWords.some(word => message.includes(word));

    if (hasQuestionWord) {
      // Try to provide a helpful response based on keywords in their question
      const keywords = message.split(' ').filter(word => word.length > 3);
      const relevantKeywords = keywords.filter(keyword =>
        ['crime', 'safety', 'city', 'police', 'danger', 'secure', 'risk', 'rate', 'data', 'analysis'].some(relevant =>
          keyword.includes(relevant) || relevant.includes(keyword)
        )
      );

      if (relevantKeywords.length > 0) {
        return `🤔 I understand you're asking about **${relevantKeywords.join(', ')}**! \n\n💡 **Here are some ways I can help:**\n\n🏙️ **City-specific info:** "How safe is Mumbai?" or "Crime rate in Delhi"\n📊 **Statistics:** "Total crimes" or "Most common crime type"\n⏰ **Time patterns:** "Safest time to travel" or "Peak crime hours"\n🛡️ **Safety tips:** "Safety recommendations" or "How to stay safe"\n🔍 **Comparisons:** "Compare cities" or "Safest vs most dangerous"\n\n❓ **Try rephrasing your question with specific details - I have tons of data to share!**`;
      }
    }

    // Fun/creative default responses with actionable suggestions
    const smartResponses = [
      `🔍 **Data Detective ready!** I've analyzed ${data.length.toLocaleString()} crime records across ${cityStats.length} cities!\n\n💡 **Try asking:**\n• "What's the safest city?"\n• "Crime trends by time"\n• "How safe is [city name]?"\n• "Most common crime types"\n\nWhat interests you most?`,

      `🎯 **Crime Analysis Expert here!** I can dive deep into patterns, predict trends, and give you safety insights!\n\n🔥 **Popular questions:**\n• "Compare Mumbai vs Delhi safety"\n• "Best time to travel safely"\n• "Weapon crime statistics"\n• "Police effectiveness by city"\n\nWhat would you like to explore?`,

      `💡 **Your Safety Data Guru!** I've got real insights from actual crime data to help you make informed decisions!\n\n✨ **I can help with:**\n• City safety ratings & comparisons\n• Time-based risk analysis\n• Crime type breakdowns\n• Prevention strategies\n\nWhat specific information do you need?`,

      `🧠 **Pattern Recognition activated!** I love finding trends that keep people safe!\n\n📈 **Fun fact:** Did you know crime patterns vary by hour, season, and location? \n\n🤓 **Ask me about:**\n• Peak crime hours\n• Seasonal trends\n• City-specific risks\n• Demographics & safety\n\nWhat pattern should we discover?`
    ];

    return smartResponses[Math.floor(Math.random() * smartResponses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      // Use simplified safe response system
      const response = generateResponse(currentInput);

      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsTyping(false);
      }, 1000 + Math.random() * 1500);
    } catch (error) {
      console.error('Response generation failed:', error);
      setTimeout(() => {
        const fallbackMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: "🤖 I'm having trouble processing that request. Try asking about crime statistics or city safety!",
          timestamp: new Date()
        };

        setMessages(prev => [...prev, fallbackMessage]);
        setIsTyping(false);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Floating button and chat modal
  return (
    <>
      {/* Floating Chat Icon */}
      {!isOpen && (
        <button
          className="fixed bottom-6 right-6 z-50 bg-blue-700 hover:bg-blue-800 text-white rounded-full shadow-lg p-4 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
          style={{ boxShadow: '0 4px 16px rgba(30, 58, 138, 0.3)' }}
          aria-label="Open AI Assistant"
          onClick={() => setIsOpen(true)}
        >
          <Bot className="w-7 h-7" />
        </button>
      )}
      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black bg-opacity-40">
          <div className="w-full max-w-md mx-auto bg-blue-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border-2 border-blue-400 flex flex-col h-[70vh] sm:h-[80vh] animate-fade-in-up relative">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-blue-400 bg-blue-800 rounded-t-2xl">
              <div className="flex items-center space-x-2">
                <Bot className="w-6 h-6 text-blue-300" />
                <span className="font-bold text-white text-lg">AI Assistant</span>
              </div>
              <button
                className="text-blue-300 hover:text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => setIsOpen(false)}
                aria-label="Close Chat"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {/* Chat Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-blue-900">
              {messages.map((msg, idx) => (
                <div key={msg.id || idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}> 
                  <div className={`max-w-[80%] px-4 py-2 rounded-2xl shadow-md text-sm whitespace-pre-line ${msg.type === 'user' ? 'bg-blue-700 text-white' : 'bg-blue-800 text-blue-100'}`}>{msg.content}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            {/* Input */}
            <form
              className="flex items-center p-3 border-t border-blue-400 bg-blue-800"
              onSubmit={e => { e.preventDefault(); handleSendMessage(); }}
            >
              <input
                className="flex-1 form-input bg-blue-900 border-blue-400 text-white placeholder-blue-300 rounded-lg px-4 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                type="text"
                placeholder="Ask me about crime data..."
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isTyping}
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="Send"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
