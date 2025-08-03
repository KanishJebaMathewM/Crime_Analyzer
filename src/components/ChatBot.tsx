import React, { useState, useRef, useEffect } from 'react';
import { CrimeRecord, CityStats, ChatMessage } from '../types/crime';
import { MessageCircle, Send, Bot, User } from 'lucide-react';

interface ChatBotProps {
  data: CrimeRecord[];
  cityStats: CityStats[];
}

const ChatBot: React.FC<ChatBotProps> = ({ data, cityStats }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your Crime Analysis AI Assistant. I can help you analyze crime data, provide safety recommendations, and answer questions about crime patterns. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

      return `👥 **Demographics Deep Dive:**\n\n🎂 **Average victim age:** ${avgAge} years (peak vulnerability in prime of life!)\n\n📊 **Gender breakdown:**\n${genderStats.map(g => `${g.gender}: ${g.percentage}% (${g.count.toLocaleString()} cases)`).join('\n')}\n\n🧠 **Insight:** Crime isn't random - it follows patterns. Young adults face higher risks due to lifestyle factors (nightlife, commuting, etc.)\n\n💡 **Takeaway:** Awareness peaks in your 20s-30s are crucial for prevention!`;
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

    // Enhanced specific city queries
    const cityQuery = cityStats.find(city =>
      message.includes(city.city.toLowerCase())
    );
    if (cityQuery) {
      const performance = cityQuery.safetyRating >= 4 ? 'excellent' : cityQuery.safetyRating >= 3 ? 'good' : 'needs improvement';
      const trend = cityQuery.riskLevel === 'Low' ? '📈 trending safer' : cityQuery.riskLevel === 'High' ? '📉 needs attention' : '⚖️ stable';

      return `🏙️ **${cityQuery.city} Crime Profile:**\n\n⭐ **Safety Rating:** ${cityQuery.safetyRating}/5 (${performance})\n📊 **Total Cases:** ${cityQuery.totalCrimes.toLocaleString()}\n🎯 **Police Effectiveness:** ${((cityQuery.closedCases / cityQuery.totalCrimes) * 100).toFixed(1)}% closure rate\n🔍 **Top Concern:** ${cityQuery.mostCommonCrime}\n📈 **Status:** ${trend}\n\n${cityQuery.riskLevel === 'High' ? '🚨 **Travel Advisory:** High caution recommended - stick to main areas, travel in groups, avoid late hours' : cityQuery.riskLevel === 'Medium' ? '⚡ **Moderate Risk:** Standard safety precautions should keep you safe' : '✅ **Low Risk:** Relatively safe, but stay alert as always!'}\n\n💡 **Local tip:** Every city has safe and risky areas - location and timing matter more than overall statistics!`;
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

    // Fun/creative default responses
    const creativeResponses = [
      "🔍 **Data Detective at your service!** I've got crime stats, safety tips, and city insights ready to roll! What mystery shall we solve? Try asking about specific cities, time patterns, or safety recommendations!",
      "🎯 **Crime Analysis Command Center activated!** I can compare cities, predict patterns, analyze demographics, or just chat about staying safe. What's on your mind?",
      "💡 **Your Personal Safety Guru here!** I speak fluent statistics and I'm fluent in 'staying alive 101.' Ask me anything - from 'which city is safest?' to 'what time should I avoid walking alone?'",
      "🚨 **Plot twist:** I'm actually excited about crime data (in a completely non-creepy way)! I love finding patterns that keep people safe. What would you like to explore?",
      "🧠 **Brain powered up and ready!** I've analyzed thousands of crime records and I'm ready to share insights, debunk fears, or help you make smarter safety choices. What's your question?",
      "⚡ **Data Wizard at your command!** Whether you want hard numbers, practical advice, or just want to satisfy your curiosity about crime patterns, I'm here for it! What sparks your interest?"
    ];

    return creativeResponses[Math.floor(Math.random() * creativeResponses.length)];
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
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const response = generateResponse(inputValue);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow h-[600px] flex flex-col">
      <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <Bot className="w-6 h-6 text-blue-500 mr-3" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Crime Analysis AI Assistant
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ask me anything about crime data and safety
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.type === 'user' 
                  ? 'bg-blue-500 ml-2' 
                  : 'bg-gray-300 dark:bg-gray-600 mr-2'
              }`}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                )}
              </div>
              
              <div className={`px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}>
                <div className="text-sm whitespace-pre-wrap">
                  {message.content}
                </div>
                <div className={`text-xs mt-1 ${
                  message.type === 'user' 
                    ? 'text-blue-100' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex">
              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 mr-2 flex items-center justify-center">
                <Bot className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about crime data, safety tips, or city statistics..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Try: "What's the safest city?", "Crime trends by time", "Safety recommendations"
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
