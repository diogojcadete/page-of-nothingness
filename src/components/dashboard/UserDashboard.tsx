
import React from 'react';
import UserStats from './UserStats';
import UserTasks from './UserTasks';

const UserDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">My Performance</h2>
      <UserStats />
      <UserTasks />
    </div>
  );
};

export default UserDashboard;
