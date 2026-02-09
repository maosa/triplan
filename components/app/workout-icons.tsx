import { Bike, Waves, Footprints, Dumbbell, BedDouble, Activity, HelpCircle } from "lucide-react"

export const getWorkoutIcon = (type: string) => {
    switch (type) {
        case "Swim":
            return <Waves className="h-5 w-5 text-blue-400" />
        case "Bike":
            return <Bike className="h-5 w-5 text-green-400" />
        case "Run":
            return <Footprints className="h-5 w-5 text-orange-400" />
        case "Strength":
            return <Dumbbell className="h-5 w-5 text-red-400" />
        case "Rest":
            return <BedDouble className="h-5 w-5 text-gray-400" />
        case "Stretching":
            return <Activity className="h-5 w-5 text-purple-400" />
        case "Other":
            return <Activity className="h-5 w-5 text-purple-400" />
        default:
            return <HelpCircle className="h-5 w-5 text-gray-400" />
    }
}
