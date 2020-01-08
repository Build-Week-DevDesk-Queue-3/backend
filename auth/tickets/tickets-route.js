const express = require("express");
const Ticket = require("./tickets-models");
const restricted = require("../restricted-middleware");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const tickets = await Ticket.getTickets();
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.post("/", restricted, async (req, res) => {
  const ticket = {
    title: req.body.title,
    description: req.body.description,
    attempted: req.body.attempted,
    categoryId: req.body.categoryId,
    userId: req.body.userId
  };

  try {
    const id = await Ticket.addTicket(ticket);
    await Ticket.usersTicketsAdd(id);
    res.status(200).json({ message: "successfully added ticket" });
  } catch (error) {
    res.status(500).json(error);
  }
});

router.put("/assign", restricted, verifyTicket, async (req, res) => {
  const { userId } = req.body;
  try {
    if (req.ticket.openStatus === 1) {
      await Ticket.assignTicket(userId, req.ticket.id);
      await Ticket.updateOpenStatus(req.ticket.id, req.ticket.openStatus);
      res
        .status(200)
        .json({ message: "successfully assigned ticket to yourself" });
    } else {
      res
        .status(409)
        .json({ message: "Ticket is currently not open to be taken" });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

router.put("/unassign", restricted, verifyTicket, async (req, res) => {
  try {
    if (req.ticket.openStatus === 0) {
      await Ticket.unassignTicket(req.ticket.id);
      await Ticket.updateOpenStatus(req.ticket.id, req.ticket.openStatus);
      res
        .status(200)
        .json({ message: "successfully unassigned ticket from yourself" });
    } else {
      res
        .status(409)
        .json({ message: "This ticket is not being assigned to this user" });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

router.get("/categories", restricted, async (req, res) => {
  try {
    const categories = Ticket.getCategories();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json(error);
  }
});

async function verifyTicket(req, res, next) {
  const { ticketId } = req.body;

  try {
    const ticket = await Ticket.getTicket(ticketId);
    req.ticket = ticket[0];
    next();
  } catch (error) {
    res.status(500).json(error);
  }
}

module.exports = router;
