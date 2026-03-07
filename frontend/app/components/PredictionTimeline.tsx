export default function PredictionTimeline({prediction}:{prediction:any}){

  if(!prediction) return null

  return(

    <div className="border rounded-xl p-6 bg-neutral-900">

      <h2 className="text-xl font-semibold mb-4">
        Cycle Prediction
      </h2>

      <div className="grid grid-cols-3 gap-6">

        <Card
          title="Next Period"
          value={prediction.predicted_next_start}
        />

        <Card
          title="Cycle Length"
          value={`${prediction.cycle_length_prediction} days`}
        />

        <Card
          title="Confidence"
          value={`${prediction.confidence_score}%`}
        />

      </div>

    </div>

  )

}

function Card({title,value}:{title:string,value:string}){

  return(

    <div className="border rounded-lg p-4 bg-black">

      <p className="text-gray-400 text-sm">
        {title}
      </p>

      <p className="text-lg font-semibold">
        {value}
      </p>

    </div>

  )

}