const { expect } = require("chai");

describe("SimpleVoting", function () {
  let SimpleVoting;
  let simpleVoting;
  let chairman;
  let voter1;
  let voter2;
  let voter3;

  beforeEach(async function () {
    // Get the contract factory and signers
    SimpleVoting = await ethers.getContractFactory("SimpleVoting");
    [chairman, voter1, voter2, voter3] = await ethers.getSigners();

    // Deploy the contract
    simpleVoting = await SimpleVoting.deploy();
    await simpleVoting.waitForDeployment();
  });

  it("Should set the chairman as the deployer", async function () {
    // Check that the chairman is set to the deployer's address
    expect(await simpleVoting.chairman()).to.equal(chairman.address);
  });

  it("Should allow chairman to create stakeholders", async function () {
    // Create a stakeholder
    await simpleVoting.createStakeHolder(voter1.address, 1); // 1 = TEACHER

    // Check that the stakeholder was created with the correct role
    const stakeholder = await simpleVoting.stakeholders(voter1.address);
    expect(stakeholder.role).to.equal(1); // Role 1 is TEACHER
  });

  it("Should not allow non-chairman to create stakeholders", async function () {
    // Try creating a stakeholder from a non-chairman account (should revert)
    await expect(
      simpleVoting.connect(voter1).createStakeHolder(voter2.address, 2) // 2 = STUDENT
    ).to.be.revertedWith("Only Chairman can do this.");
  });

  it("Should allow the chairman to toggle voting", async function () {
    // Initially, voting should be inactive
    expect(await simpleVoting.getVotingState()).to.equal(false);

    // Toggle the voting status
    await simpleVoting.toggleVoting();

    // Now, voting should be active
    expect(await simpleVoting.getVotingState()).to.equal(true);
  });

  it("Should allow a stakeholder to vote", async function () {
    // Create a stakeholder
    await simpleVoting.createStakeHolder(voter1.address, 2); // 2 = STUDENT

    // Create a candidate
    await simpleVoting.createCandidate("Candidate 1");

    // Toggle voting on
    await simpleVoting.toggleVoting();

    // Stakeholder (voter1) votes for the first candidate
    await simpleVoting.connect(voter1).vote(0);

    // Check that the candidate received the vote
    const candidate = await simpleVoting.getListOfCandidates();
    expect(candidate[0].totalVotesReceived).to.equal(1);
  });

  it("Should not allow a stakeholder to vote twice", async function () {
    // Create a stakeholder
    await simpleVoting.createStakeHolder(voter1.address, 2); // 2 = STUDENT

    // Create a candidate
    await simpleVoting.createCandidate("Candidate 1");

    // Toggle voting on
    await simpleVoting.toggleVoting();

    // Stakeholder (voter1) votes for the first candidate
    await simpleVoting.connect(voter1).vote(0);

    // Try voting again (should revert)
    await expect(simpleVoting.connect(voter1).vote(0)).to.be.revertedWith(
      "You have voted before"
    );
  });
});
