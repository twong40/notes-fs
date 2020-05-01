const supertest = require("supertest");
const mongoose = require("mongoose");
const helper = require("./test_helper");
const app = require("../app");
const api = supertest(app);

const bcrypt = require("bcrypt");
const User = require("../models/user");

describe("when there is initally one user in the DB", () => {
  beforeEach(async () => {
    await User.deleteMany({});

    let passwordHash = await bcrypt.hash("skekret", 10);
    const user = new User({ username: "root", name: "rootacc", passwordHash });
    await user.save();
    passwordHash = await bcrypt.hash("password", 10);
    const other = new User({ username: "test", name: "bob", passwordHash });
    await other.save();
  });

  test("creation succeeds with a fresh username", async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: "twong",
      name: "thomas",
      password: "password",
    };

    await api
      .post("/api/users")
      .send(newUser)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1);
    const usernames = usersAtEnd.map((u) => u.username);
    expect(usernames).toContain(newUser.username);
  });

  test("creation fails with proper statuscode and message if username is already taken", async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: "root",
      name: "Superuser",
      password: "salainen",
    };

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    expect(result.body.error).toContain("`username` to be unique");

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd.length).toBe(usersAtStart.length);
  });
});

afterAll(() => {
  mongoose.connection.close();
});
