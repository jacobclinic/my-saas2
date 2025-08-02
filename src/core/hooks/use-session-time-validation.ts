import { useEffect, useState } from "react";
import getLogger from "../logger";

const logger = getLogger();

const useSessionTimeValidation = (startTime: string) => {
    const [isWithinJoinWindow, setIsWithinJoinWindow] = useState(false);

    useEffect(() => {
        const checkTimeWindow = () => {
            try {

                if (!startTime) {
                    setIsWithinJoinWindow(false);
                    return;
                }
                const now = new Date();
                const sessionStart = new Date(startTime);

                if (isNaN(sessionStart.getTime())) {
                    setIsWithinJoinWindow(false);
                    return;
                }

                const oneHourBefore = new Date(sessionStart.getTime() - 60 * 60 * 1000);
                const isWithinWindow = now >= oneHourBefore && now <= sessionStart;

                setIsWithinJoinWindow(isWithinWindow);
            } catch (error) {
                logger.error('Error checking session time window:', error);
                setIsWithinJoinWindow(false);
            }
        };

        checkTimeWindow();

        const interval = setInterval(checkTimeWindow, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    return isWithinJoinWindow;
};

export default useSessionTimeValidation;