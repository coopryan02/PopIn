import { Layout } from "@/components/layout/Layout";
import { FriendHangouts } from "@/components/friends/FriendHangouts";
import { useAuth } from "@/store/authStore";
import { useCalendarStore } from "@/store/calendarStore";

const FriendHangoutsPage = () => {
  const { user } = useAuth();
  const { getAllFriendHangouts } = useCalendarStore(user?.id);

  const friendHangouts = getAllFriendHangouts();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Friends' Hangouts
          </h1>
          <p className="text-muted-foreground">
            See what your friends are planning and discover opportunities to
            join them
          </p>
        </div>

        <FriendHangouts friendHangouts={friendHangouts} />
      </div>
    </Layout>
  );
};

export default FriendHangoutsPage;
