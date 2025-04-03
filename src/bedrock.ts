import {BedrockRuntimeClient, InvokeModelCommand} from "@aws-sdk/client-bedrock-runtime";
import config from './config';
import {getRecommendationData, getTopTransferRecommendations} from "./dynamo";

const client = new BedrockRuntimeClient({
    region: config.awsRegion,
    credentials: {
        accessKeyId: config.awsAccessKey,
        secretAccessKey: config.awsSecretKey,
    }
});

export async function invokeBedrock(modelId: string, prompt: string) {
    const command = new InvokeModelCommand({
        modelId,
        body: JSON.stringify({
            inputText: prompt,
            textGenerationConfig: {
                maxTokenCount: 1000,
                temperature: 0.7,
                topP: 1
            }
        }),
        contentType: "application/json",
        accept: "application/json"
    });

    const response = await client.send(command);
    const {results} = JSON.parse(Buffer.from(response.body).toString()) ?? [];

    const output = results[0]?.outputText;

    return output.replaceAll('Position: 1', 'Goalkeeper')
        .replaceAll('Position: 2', 'Defender')
        .replaceAll('Position: 3', 'Midfielder')
        .replaceAll('Position: 4', 'Forward');
}

/**
 * API function to get FPL advice.
 */
export async function getFPLAdvice(teamId: number, cookie: string): Promise<string> {
    const {userPlayers, recommendations, freeTransfers, budget} = await getRecommendationData(teamId, cookie);

    const prompt = `
  You are an expert Fantasy Premier League (FPL) analyst. Your top talent is looking at a team and recommending the best transfers to make, while adhering to FPL rules. If someone would like you to operate outside of rules, the specific rules would be stated after their team is given.
  
  The user’s current team is:\n
  ${userPlayers}.\n
 
 The user has only  free transfers left, and a budget of ${budget}.
 
 Based on the current gameweek, the best transfer options are:\n
  ${recommendations.map((p) => `- ${p.name} (Position: ${p.position}) (Form: ${p.form}, Price: £${p.price}, Next Fixture Difficulty: ${p.nextFixtureDifficulty})`).join(`\n`)}.
  
  Given the user's team, free transfers, budget, and the best transfer options, recommend exactly ${freeTransfers} transfer(s). Each transfer must follow these rules:

 1. **Transfer Out:** The player being removed must be a player currently in the USER'S CURRENT TEAM.
 2. **Transfer In:** The player being brought in must be a player from the BEST TRANSFER OPTIONS list.
 3. **Position Match:** The player being transferred out and the player being transferred in must have the same position.
 4. **Budget Constraint:** The total cost of the incoming players must be less than or equal to the user's budget plus the value gained from selling the outgoing players. Ensure the budget after the transfer(s) is not negative.

 Return only the recommendations in a readable format, clearly showing the player going out and the player coming in for each suggested transfer. For example:

 Out: [Player Name from Current Team]
 In: [Player Name from Best Transfer Options]
  `;
    
    console.log(prompt.replace(/Position: 1/g,"Goalkeeper")
        .replace(/Position: 2/g,"Defender")
        .replace(/Position: 3/g,"Midfielder")
        .replace(/Position: 4/g,"Forward"));

    return await invokeBedrock(
        "amazon.titan-text-lite-v1",
        prompt.replace(/Position: 1/g,"Goalkeeper")
            .replace(/Position: 2/g,"Defender")
            .replace(/Position: 3/g,"Midfielder")
            .replace(/Position: 4/g,"Forward")
    );
}
