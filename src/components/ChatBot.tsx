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
    const message = userMessage.toLowerCase();
    
    // Crime statistics queries
    if (message.includes('total') && message.includes('crime')) {
      return `Based on the current dataset, there are **${data.length.toLocaleString()} total crime records** across all cities. This includes various types of crimes from theft to violent offenses.`;
    }
    
    if (message.includes('safest') && message.includes('city')) {
      const safestCity = cityStats.reduce((prev, current) => 
        prev.safetyRating > current.safetyRating ? prev : current
      );
      return `**${safestCity.city}** is currently the safest city with a safety rating of **${safestCity.safetyRating}/5**. It has ${safestCity.totalCrimes} total crimes with a ${((safestCity.closedCases / safestCity.totalCrimes) * 100).toFixed(1)}% case closure rate.`;
    }
    
    if (message.includes('dangerous') || (message.includes('worst') && message.includes('city'))) {
      const mostDangerous = cityStats.reduce((prev, current) => 
        prev.safetyRating < current.safetyRating ? prev : current
      );
      return `**${mostDangerous.city}** has the highest crime rate with a safety rating of **${mostDangerous.safetyRating}/5**. The most common crime there is ${mostDangerous.mostCommonCrime}. I recommend extra caution if traveling there.`;
    }

    // Time-based queries
    if (message.includes('time') || message.includes('hour')) {
      const hourMap = new Map<number, number>();
      data.forEach(record => {
        const hour = parseInt(record.timeOfOccurrence.split(':')[0]);
        hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
      });
      const peakHour = Array.from(hourMap.entries()).reduce((max, current) => 
        current[1] > max[1] ? current : max
      );
      const safestHour = Array.from(hourMap.entries()).reduce((min, current) => 
        current[1] < min[1] ? current : min
      );
      
      return `**Peak crime time:** ${peakHour[0]}:00 with ${peakHour[1]} incidents.\n**Safest time:** ${safestHour[0]}:00 with ${safestHour[1]} incidents.\n\n🌙 **Late night hours (10 PM - 2 AM)** tend to be riskier. I recommend avoiding travel during these times or using well-lit, populated areas.`;
    }

    // Crime type queries
    if (message.includes('common') && message.includes('crime')) {
      const crimeTypeMap = new Map<string, number>();
      data.forEach(record => {
        crimeTypeMap.set(record.crimeDescription, (crimeTypeMap.get(record.crimeDescription) || 0) + 1);
      });
      const topCrimes = Array.from(crimeTypeMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      
      return `**Most common crimes:**\n1. **${topCrimes[0][0]}** - ${topCrimes[0][1]} cases\n2. **${topCrimes[1][0]}** - ${topCrimes[1][1]} cases\n3. **${topCrimes[2][0]}** - ${topCrimes[2][1]} cases\n\n💡 **Prevention tip:** Be aware of these common crimes and take appropriate precautions.`;
    }

    // Weapon-related queries
    if (message.includes('weapon')) {
      const weaponMap = new Map<string, number>();
      data.forEach(record => {
        if (record.weaponUsed !== 'None' && record.weaponUsed !== 'Unknown') {
          weaponMap.set(record.weaponUsed, (weaponMap.get(record.weaponUsed) || 0) + 1);
        }
      });
      const totalWeaponCrimes = Array.from(weaponMap.values()).reduce((sum, count) => sum + count, 0);
      const weaponRate = ((totalWeaponCrimes / data.length) * 100).toFixed(1);
      
      const topWeapons = Array.from(weaponMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      
      return `**Weapon-related crimes:** ${totalWeaponCrimes.toLocaleString()} cases (${weaponRate}% of all crimes)\n\n**Most used weapons:**\n${topWeapons.map((w, i) => `${i + 1}. **${w[0]}** - ${w[1]} cases`).join('\n')}\n\n⚠️ **Safety tip:** Avoid confrontations and report suspicious activities to authorities immediately.`;
    }

    // Case closure queries
    if (message.includes('solved') || message.includes('closure') || message.includes('closed')) {
      const totalCases = data.length;
      const closedCases = data.filter(record => record.caseClosed === 'Yes').length;
      const closureRate = ((closedCases / totalCases) * 100).toFixed(1);
      
      const cityClosureRates = cityStats.map(city => ({
        city: city.city,
        rate: ((city.closedCases / city.totalCrimes) * 100).toFixed(1)
      })).sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate));
      
      return `**Overall case closure rate:** ${closureRate}% (${closedCases.toLocaleString()} of ${totalCases.toLocaleString()} cases)\n\n**Best performing cities:**\n${cityClosureRates.slice(0, 3).map((c, i) => `${i + 1}. **${c.city}** - ${c.rate}%`).join('\n')}\n\n✅ **Good news:** Police effectiveness varies by city, with some achieving excellent closure rates.`;
    }
    // Safety recommendations
    if (message.includes('safe') || message.includes('recommend') || message.includes('advice')) {
      return `🛡️ **General Safety Recommendations:**\n\n✅ Travel during daylight hours (8 AM - 6 PM)\n✅ Stay in well-populated, well-lit areas\n✅ Share your location with trusted contacts\n✅ Avoid displaying valuable items publicly\n✅ Use reputable transportation services\n✅ Trust your instincts - if something feels wrong, leave\n\n📱 **Emergency contacts:** Keep local police and emergency numbers readily available.`;
    }

    // Specific city queries
    const cityQuery = cityStats.find(city => 
      message.includes(city.city.toLowerCase())
    );
    if (cityQuery) {
      return `**${cityQuery.city} Crime Analysis:**\n\n⭐ **Safety Rating:** ${cityQuery.safetyRating}/5\n📊 **Total Crimes:** ${cityQuery.totalCrimes}\n✅ **Case Closure Rate:** ${((cityQuery.closedCases / cityQuery.totalCrimes) * 100).toFixed(1)}%\n🔍 **Most Common Crime:** ${cityQuery.mostCommonCrime}\n⚠️ **Risk Level:** ${cityQuery.riskLevel}\n\n${cityQuery.riskLevel === 'High' ? '🚨 **High risk area** - Exercise extreme caution' : cityQuery.riskLevel === 'Medium' ? '⚠️ **Medium risk** - Stay alert and follow safety protocols' : '✅ **Low risk** - Relatively safe, but maintain standard precautions'}`;
    }

    // Statistical queries
    if (message.includes('average') || message.includes('mean')) {
      const avgAge = Math.round(data.reduce((sum, record) => sum + record.victimAge, 0) / data.length);
      const avgCrimesPerCity = Math.round(data.length / cityStats.length);
      
      return `**Key Averages:**\n\n👥 **Average victim age:** ${avgAge} years\n🏙️ **Average crimes per city:** ${avgCrimesPerCity.toLocaleString()}\n📊 **Average safety rating:** ${(cityStats.reduce((sum, city) => sum + city.safetyRating, 0) / cityStats.length).toFixed(1)}/5\n\n📈 **Insight:** These averages help identify patterns and benchmark individual cities against overall trends.`;
    }
    // Default responses for unrecognized queries
    const responses = [
      "I can help you analyze crime statistics, safety recommendations, and city comparisons. Try asking about the safest city, weapon usage, or case closure rates!",
      "Would you like to know about crime patterns in a specific city, time-based analysis, victim demographics, or safety recommendations?",
      "I have access to comprehensive crime data. Ask me about total crimes, case closure rates, weapon statistics, or safety ratings for different cities.",
      "Try questions like: 'What's the safest city?', 'Show me weapon statistics', 'Which city has the best police performance?', or 'Give me safety advice'."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
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