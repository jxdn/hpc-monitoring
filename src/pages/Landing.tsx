import React from 'react';
import { Cpu, Activity, BarChart3, Zap, Clock, Users, Shield, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Landing: React.FC = () => {
  const features = [
    {
      icon: <Cpu className="w-8 h-8" />,
      title: 'Real-time Monitoring',
      description: 'Track cluster resources, jobs, and performance metrics in real-time',
      color: 'purple'
    },
    {
      icon: <Activity className="w-8 h-8" />,
      title: 'Job Analytics',
      description: 'Detailed job statistics, wait times, and completion history',
      color: 'blue'
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'GPU Analytics',
      description: 'Track GPU usage, utilization patterns, and optimize resource allocation',
      color: 'green'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Performance Metrics',
      description: 'Comprehensive performance metrics and system health monitoring',
      color: 'orange'
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Jobs Processed', icon: <Activity /> },
    { value: '50+', label: 'GPU Nodes', icon: <Cpu /> },
    { value: '500+', label: 'Active Users', icon: <Users /> },
    { value: '99.9%', label: 'Uptime', icon: <Shield /> }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      purple: 'from-purple-600 to-purple-700',
      blue: 'from-blue-600 to-blue-700',
      green: 'from-green-600 to-green-700',
      orange: 'from-orange-600 to-orange-700',
    };
    return colors[color as keyof typeof colors] || colors.purple;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="animated-bg h-96 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="text-center text-white px-8 animate-slide-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              HPC Monitoring Dashboard
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Real-time cluster monitoring and analytics
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                to="/dashboard"
                className="px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                View Dashboard
              </Link>
              <Link
                to="/test"
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                Test Frontend
              </Link>
              <Link
                to="/cluster"
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-all duration-300"
              >
                Cluster Overview
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="stat-card bg-white shadow-2xl animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-purple-600 mb-3">
                {React.cloneElement(stat.icon as React.ReactElement, { className: 'w-10 h-10' })}
              </div>
              <h4 className="text-4xl font-bold gradient-text mb-1">{stat.value}</h4>
              <p className="text-gray-600 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to monitor your HPC cluster
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="modern-card group animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className={`w-16 h-16 bg-gradient-to-br ${getColorClasses(feature.color)} rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                {React.cloneElement(feature.icon as React.ReactElement, { className: 'w-8 h-8' })}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links Section */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="dashboard-grid">
          <Link to="/cluster" className="modern-card group">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Cluster Dashboard</h3>
                <p className="text-sm text-gray-600">Monitor cluster resources</p>
              </div>
            </div>
            <div className="flex items-center text-purple-600 font-semibold group-hover:translate-x-2 transition-transform">
              View Dashboard <TrendingUp className="w-4 h-4 ml-2" />
            </div>
          </Link>

          <Link to="/jobs" className="modern-card group">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Job Monitor</h3>
                <p className="text-sm text-gray-600">Track running jobs</p>
              </div>
            </div>
            <div className="flex items-center text-purple-600 font-semibold group-hover:translate-x-2 transition-transform">
              View Jobs <TrendingUp className="w-4 h-4 ml-2" />
            </div>
          </Link>

          <Link to="/analytics" className="modern-card group">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-green-600 to-green-700 rounded-xl group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-600">View detailed statistics</p>
              </div>
            </div>
            <div className="flex items-center text-purple-600 font-semibold group-hover:translate-x-2 transition-transform">
              View Analytics <TrendingUp className="w-4 h-4 ml-2" />
            </div>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold">HPC Monitor</span>
          </div>
          <p className="text-gray-400 mt-4">
            Real-time HPC cluster monitoring and analytics platform
          </p>
          <p className="text-gray-500 mt-2 text-sm">
            © 2026 HPC Monitor. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;